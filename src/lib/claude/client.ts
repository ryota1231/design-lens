import Anthropic from '@anthropic-ai/sdk';
import { AnalysisResultSchema, type AnalysisResult } from '@/types/analysis';
import { buildAnalyzeSystemPrompt, buildReproductionPromptSystem } from './prompts';

const MODEL = 'claude-sonnet-4-5';

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
  return AnalysisResultSchema.parse({ ...json, rawResponse: text });
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
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/, '')
    .replace(/```$/, '')
    .trim();

  try {
    const parsed: unknown = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Claude のレスポンス JSON がオブジェクトではありません');
    }

    return parsed as Record<string, unknown>;
  } catch {
    throw new Error(`Claude のレスポンスが JSON ではありません: ${cleaned.slice(0, 100)}...`);
  }
}
