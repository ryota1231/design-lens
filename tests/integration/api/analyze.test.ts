import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/claude/client', () => ({
  analyzeImage: vi.fn(),
}));

import { POST } from '@/app/api/analyze/route';
import { analyzeImage } from '@/lib/claude/client';
import type { AnalysisResult } from '@/types/analysis';

const validAnalysis: AnalysisResult = {
  concept: 'c',
  typography: 't',
  fontHints: [],
  colors: [{ hex: '#FF0000', role: 'primary' }],
  composition: 'x',
  target: 'x',
  extractedText: [],
  category: 'pop',
  visualFlow: '',
  principles: [],
  improvements: [],
  applications: [],
  rawResponse: '{}',
};

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/analyze', () => {
  beforeEach(() => {
    vi.mocked(analyzeImage).mockReset();
  });

  it('should return 400 for invalid input', async () => {
    const res = await POST(makeRequest({ image: 'not-data-url', language: 'ja' }));
    expect(res.status).toBe(400);
  });

  it('should return 200 and analysis JSON for valid input', async () => {
    vi.mocked(analyzeImage).mockResolvedValue(validAnalysis);
    const res = await POST(
      makeRequest(
        { image: 'data:image/jpeg;base64,xxx', language: 'ja' },
        { 'x-forwarded-for': '1.2.3.4' },
      ),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.concept).toBe('c');
  });

  it('should return 500 when Claude fails', async () => {
    vi.mocked(analyzeImage).mockRejectedValue(new Error('boom'));
    const res = await POST(
      makeRequest(
        { image: 'data:image/jpeg;base64,xxx', language: 'ja' },
        { 'x-forwarded-for': '1.2.3.5' },
      ),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'analysis_failed' });
  });

  it('should return a billing error when Claude reports insufficient credits', async () => {
    vi.mocked(analyzeImage).mockRejectedValue(new Error('credit balance is too low'));
    const res = await POST(
      makeRequest(
        { image: 'data:image/jpeg;base64,xxx', language: 'ja' },
        { 'x-forwarded-for': '1.2.3.6' },
      ),
    );
    expect(res.status).toBe(402);
    await expect(res.json()).resolves.toEqual({ error: 'anthropic_billing' });
  });
});
