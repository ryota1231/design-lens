import { NextResponse } from 'next/server';
import { APIError } from '@anthropic-ai/sdk';
import { analyzeImage } from '@/lib/claude/client';
import { analyzeRateLimiter } from '@/lib/rate-limit/memory-store';
import { AnalyzeRequestSchema } from '@/types/analysis';

export const runtime = 'nodejs';
export const maxDuration = 30;

function getClientKey(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();

  return 'unknown';
}

function getMediaType(dataUrl: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,/);
  if (!match) throw new Error('未対応の画像形式');

  return match[1] as 'image/jpeg' | 'image/png' | 'image/webp';
}

type AnalyzeErrorCode =
  | 'analysis_failed'
  | 'anthropic_auth_failed'
  | 'anthropic_billing'
  | 'anthropic_rate_limited'
  | 'anthropic_unavailable'
  | 'image_too_large';

function classifyAnalyzeError(err: unknown): {
  code: AnalyzeErrorCode;
  status: number;
  sourceStatus?: number;
  sourceType?: string | null;
} {
  const message = err instanceof Error ? err.message : '';

  if (err instanceof APIError) {
    const sourceStatus = err.status;
    if (sourceStatus === 401) {
      return { code: 'anthropic_auth_failed', status: 502, sourceStatus, sourceType: err.type };
    }
    if (sourceStatus === 403 || /billing|credit|balance|payment|quota/i.test(message)) {
      return { code: 'anthropic_billing', status: 402, sourceStatus, sourceType: err.type };
    }
    if (sourceStatus === 429) {
      return { code: 'anthropic_rate_limited', status: 429, sourceStatus, sourceType: err.type };
    }
    if (sourceStatus === 413) {
      return { code: 'image_too_large', status: 413, sourceStatus, sourceType: err.type };
    }
    if (typeof sourceStatus === 'number' && sourceStatus >= 500) {
      return { code: 'anthropic_unavailable', status: 503, sourceStatus, sourceType: err.type };
    }
  }

  if (/billing|credit|balance|payment|quota/i.test(message)) {
    return { code: 'anthropic_billing', status: 402 };
  }
  if (/timed out|timeout|overloaded|unavailable|connection/i.test(message)) {
    return { code: 'anthropic_unavailable', status: 503 };
  }

  return { code: 'analysis_failed', status: 500 };
}

export async function POST(req: Request) {
  const clientKey = getClientKey(req);

  const rate = analyzeRateLimiter.check(clientKey);
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterMs: rate.retryAfterMs },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rate.retryAfterMs / 1000)) },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = AnalyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const mediaType = getMediaType(parsed.data.image);
    const result = await analyzeImage({
      imageBase64: parsed.data.image,
      mediaType,
      language: parsed.data.language,
    });

    return NextResponse.json(result);
  } catch (err) {
    const classified = classifyAnalyzeError(err);
    console.error('[/api/analyze] error', {
      code: classified.code,
      sourceStatus: classified.sourceStatus,
      sourceType: classified.sourceType,
      message: err instanceof Error ? err.message : String(err),
    });

    return NextResponse.json({ error: classified.code }, { status: classified.status });
  }
}
