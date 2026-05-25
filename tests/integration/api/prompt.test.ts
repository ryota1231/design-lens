import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/claude/client', () => ({
  generateReproductionPrompt: vi.fn(),
}));

import { POST } from '@/app/api/prompt/route';
import { generateReproductionPrompt } from '@/lib/claude/client';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.6' },
    body: JSON.stringify(body),
  });
}

const validAnalysis = {
  concept: 'c',
  typography: 't',
  fontHints: [],
  colors: [{ hex: '#FF0000', role: 'primary' }],
  composition: 'x',
  target: 'x',
  extractedText: [],
  category: 'pop' as const,
};

describe('POST /api/prompt', () => {
  beforeEach(() => vi.mocked(generateReproductionPrompt).mockReset());

  it('should return 400 for invalid input', async () => {
    const res = await POST(makeRequest({ language: 'ja' }));
    expect(res.status).toBe(400);
  });

  it('should return 200 with prompt string', async () => {
    vi.mocked(generateReproductionPrompt).mockResolvedValue('生成されたプロンプト');
    const res = await POST(makeRequest({ analysis: validAnalysis, language: 'ja' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.prompt).toBe('生成されたプロンプト');
  });
});
