import { NextResponse } from 'next/server';
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
    console.error('[/api/analyze] error', err);
    return NextResponse.json({ error: 'analysis_failed' }, { status: 500 });
  }
}
