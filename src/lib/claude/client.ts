import Anthropic from '@anthropic-ai/sdk';
import { AnalysisResultSchema, type AnalysisResult, type Category } from '@/types/analysis';
import { buildAnalyzeSystemPrompt, buildReproductionPromptSystem } from './prompts';

const MODEL = 'claude-sonnet-4-6';
const CATEGORY_VALUES = ['sign', 'logo', 'pop', 'signage', 'other'] as const;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY が未設定です');

  return new Anthropic({ apiKey });
}

function extractText(response: Anthropic.Messages.Message): string {
  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude のレスポンスにテキストブロックがありません');
  }

  return textBlock.text;
}

export async function analyzeImage(args: {
  imageBase64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  language: 'ja' | 'en';
}): Promise<AnalysisResult> {
  const client = getClient();
  const systemPrompt = buildAnalyzeSystemPrompt(args.language);
  const base64 = args.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: args.mediaType,
              data: base64,
            },
          },
          {
            type: 'text',
            text:
              args.language === 'ja'
                ? 'このデザインを観察してください。'
                : 'Please observe this design.',
          },
        ],
      },
    ],
  });

  const text = extractText(response);
  const json = tryParseJsonObject(text);
  const normalized = normalizeAnalysisJson(json, args.language);
  return AnalysisResultSchema.parse({ ...normalized, rawResponse: text });
}

export async function generateReproductionPrompt(args: {
  analysis: Omit<AnalysisResult, 'rawResponse'>;
  language: 'ja' | 'en';
}): Promise<string> {
  const client = getClient();
  const systemPrompt = buildReproductionPromptSystem(args.language);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content:
          args.language === 'ja'
            ? `次の解析結果を読み、画像生成AI用の再現プロンプトを書いてください。\n\n${JSON.stringify(args.analysis, null, 2)}`
            : `Read the following analysis and write a reproduction prompt for image-generation AI.\n\n${JSON.stringify(args.analysis, null, 2)}`,
      },
    ],
  });

  return extractText(response).trim();
}

function tryParseJsonObject(text: string): Record<string, unknown> {
  const candidates = getJsonCandidates(text);

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        continue;
      }

      return parsed as Record<string, unknown>;
    } catch {
      // Try the next likely JSON fragment.
    }
  }

  throw new Error(`Claude のレスポンスが JSON ではありません: ${text.trim().slice(0, 100)}...`);
}

function getJsonCandidates(text: string): string[] {
  const trimmed = text.trim();
  const candidates = [trimmed];
  const fencedJsonPattern = /```(?:json)?\s*([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;

  while ((match = fencedJsonPattern.exec(trimmed)) !== null) {
    candidates.push(match[1].trim());
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  return Array.from(new Set(candidates.filter(Boolean)));
}

function normalizeAnalysisJson(
  json: Record<string, unknown>,
  language: 'ja' | 'en',
): Omit<AnalysisResult, 'rawResponse'> {
  const fallback =
    language === 'ja'
      ? {
          concept: '画像の視覚要素から、見る人の注意を集める意図があるように見えます。',
          typography: '文字情報は限定的ですが、読みやすさを意識した扱いに見えます。',
          composition: '主要な要素に視線が向かうよう整理された構成に見えます。',
          target: '通行人や閲覧者全般',
        }
      : {
          concept: 'The visual elements appear designed to draw attention from viewers.',
          typography: 'The text treatment appears focused on readability.',
          composition: 'The composition appears arranged to guide attention toward key elements.',
          target: 'General viewers and passersby',
        };

  return {
    concept: toText(json.concept, fallback.concept),
    typography: toText(json.typography, fallback.typography),
    fontHints: toStringArray(json.fontHints),
    colors: normalizeColors(json.colors, language),
    composition: toText(json.composition, fallback.composition),
    target: toText(json.target, fallback.target),
    extractedText: toStringArray(json.extractedText),
    category: normalizeCategory(json.category),
  };
}

function normalizeColors(value: unknown, language: 'ja' | 'en'): AnalysisResult['colors'] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const fallbackRole = language === 'ja' ? '主要色' : 'Primary color';

  return values.flatMap((item) => {
    const record = isRecord(item) ? item : undefined;
    const hex = normalizeHex(record?.hex ?? item);
    if (!hex) return [];

    return [{ hex, role: toText(record?.role, fallbackRole) }];
  });
}

function normalizeHex(value: unknown): string | null {
  const text = toText(value, '');
  const longHex = text.match(/#[0-9A-Fa-f]{6}\b/);
  if (longHex) return longHex[0].toUpperCase();

  const shortHex = text.match(/#[0-9A-Fa-f]{3}\b/);
  if (!shortHex) return null;

  const [, r, g, b] = shortHex[0];
  return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
}

function normalizeCategory(value: unknown): Category {
  const text = toText(value, '').toLowerCase();
  if ((CATEGORY_VALUES as readonly string[]).includes(text)) return text as Category;

  if (text.includes('signage') || text.includes('サイネージ') || text.includes('display')) {
    return 'signage';
  }
  if (text.includes('logo') || text.includes('ロゴ')) return 'logo';
  if (text.includes('pop') || text.includes('ポップ') || text.includes('poster')) return 'pop';
  if (text.includes('sign') || text.includes('看板')) return 'sign';

  return 'other';
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const text = toText(item, '');
      return text ? [text] : [];
    });
  }

  const text = toText(value, '');
  return text ? [text] : [];
}

function toText(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
