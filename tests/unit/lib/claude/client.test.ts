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
      expect.objectContaining({ max_tokens: 2048, model: 'claude-sonnet-4-6' }),
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

  it('should retry with the fallback model when the primary model is unavailable', async () => {
    mockCreate
      .mockRejectedValueOnce(new Error('404 {"type":"error","error":{"type":"not_found_error","message":"model: claude-sonnet-4-6"}}'))
      .mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              concept: 'フォールバック解析',
              typography: '読みやすい文字',
              fontHints: [],
              colors: [],
              composition: '中央配置',
              target: '一般層',
              extractedText: [],
              category: 'other',
            }),
          },
        ],
      });

    const result = await analyzeImage({
      imageBase64: 'data:image/jpeg;base64,xxx',
      mediaType: 'image/jpeg',
      language: 'ja',
    });

    expect(result.concept).toBe('フォールバック解析');
    expect(mockCreate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ model: 'claude-sonnet-4-6' }),
    );
    expect(mockCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ model: 'claude-haiku-4-5' }),
    );
  });

  it('should normalize the new journey fields', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            concept: 'セール訴求',
            typography: '太い文字',
            fontHints: [],
            colors: [],
            composition: '中央配置',
            target: '通行人',
            extractedText: [],
            category: 'pop',
            visualFlow: 'まず中央の数字→次に商品名へ視線が動く',
            principles: [{ name: 'ジャンプ率', description: '文字の大小差で目を引く' }],
            improvements: 'コントラストを上げる',
            applications: ['カフェの新メニュー告知', '書店のフェアPOP'],
            textStyles: [
              {
                text: 'SALE',
                fontType: '極太サンセリフ',
                characteristics: '遠くからでも読める太い文字',
              },
            ],
          }),
        },
      ],
    });

    const result = await analyzeImage({
      imageBase64: 'data:image/jpeg;base64,xxx',
      mediaType: 'image/jpeg',
      language: 'ja',
    });

    expect(result.visualFlow).toBe('まず中央の数字→次に商品名へ視線が動く');
    expect(result.principles[0]).toEqual({
      name: 'ジャンプ率',
      description: '文字の大小差で目を引く',
    });
    // 文字列で返ってきた improvements が配列に正規化される
    expect(result.improvements).toEqual(['コントラストを上げる']);
    expect(result.applications).toEqual(['カフェの新メニュー告知', '書店のフェアPOP']);
    expect(result.textStyles[0]).toEqual({
      text: 'SALE',
      fontType: '極太サンセリフ',
      characteristics: '遠くからでも読める太い文字',
    });
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
        visualFlow: '',
        principles: [],
        improvements: [],
        applications: [],
        textStyles: [],
      },
      language: 'ja',
    });

    expect(result).toContain('極太サンセリフで');
  });
});
