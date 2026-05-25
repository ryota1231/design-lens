import { NextResponse } from 'next/server';
import { generateReproductionPrompt } from '@/lib/claude/client';
import { analyzeRateLimiter } from '@/lib/rate-limit/memory-store';
import { PromptRequestSchema } from '@/types/analysis';

export const runtime = 'nodejs';
export const maxDuration = 20;

function getClientKey(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();

  return 'unknown';
}

export async function POST(req: Request) {
  const rate = analyzeRateLimiter.check(getClientKey(req));
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterMs: rate.retryAfterMs },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = PromptRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  try {
    const prompt = await generateReproductionPrompt({
      analysis: parsed.data.analysis,
      language: parsed.data.language,
    });

    return NextResponse.json({ prompt });
  } catch (err) {
    console.error('[/api/prompt] error', err);
    return NextResponse.json({ error: 'prompt_failed' }, { status: 500 });
  }
}
