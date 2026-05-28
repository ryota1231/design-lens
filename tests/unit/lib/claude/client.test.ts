import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeImage, generateReproductionPrompt } from '@/lib/claude/client';

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };

      constructor() {}
    },
  };
});

describe('analyzeImage', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  it('should call Claude with the image and parse the JSON response', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            concept: 'セール訴求',
            typography: '極太サンセリフ（ヒゲのない太い文字）',
            fontHints: ['Impact'],
            colors: [{ hex: '#FF0000', role: 'primary' }],
            composition: '中央配置',
            target: '通行人',
            extractedText: ['SALE'],
            category: 'pop',
          }),
        },
      ],
    });

    const result = await analyzeImage({
      imageBase64: 'data:image/jpeg;base64,xxx',
      mediaType: 'image/jpeg',
      language: 'ja',
    });

    expect(result.concept).toBe('セール訴求');
    expect(result.colors[0].hex).toBe('#FF0000');
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-sonnet-4-6' }),
    );
  });

  it('should throw when Claude returns malformed JSON', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'not json' }],
    });

    await expect(
      analyzeImage({
        imageBase64: 'data:image/jpeg;base64,xxx',
        mediaType: 'image/jpeg',
        language: 'ja',
      }),
    ).rejects.toThrow();
  });

  it('should parse fenced JSON and normalize common Claude field variations', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: `解析結果です。

\`\`\`json
{
  "concept": "夕方の販促ポスターのように見える",
  "typography": "太い文字",
  "fontHints": "Helvetica",
  "colors": [{ "hex": "#abc", "role": "背景色" }],
  "composition": "中央に大きく配置",
  "target": "若年層",
  "extractedText": "SALE",
  "category": "poster"
}
\`\`\``,
        },
      ],
    });

    const result = await analyzeImage({
      imageBase64: 'data:image/jpeg;base64,xxx',
      mediaType: 'image/jpeg',
      language: 'ja',
    });

    expect(result.category).toBe('pop');
    expect(result.colors[0]).toEqual({ hex: '#AABBCC', role: '背景色' });
    expect(result.fontHints).toEqual(['Helvetica']);
    expect(result.extractedText).toEqual(['SALE']);
  });
});

describe('generateReproductionPrompt', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  it('should call Claude and return the prompt text', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '極太サンセリフで...' }],
    });

    const result = await generateReproductionPrompt({
      analysis: {
        concept: 'c',
        typography: 't',
        fontHints: [],
        colors: [],
        composition: 'x',
        target: 'x',
        extractedText: [],
        category: 'pop',
      },
      language: 'ja',
    });

    expect(result).toContain('極太サンセリフで');
  });
});
