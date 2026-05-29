import { describe, expect, it } from 'vitest';
import { AnalysisResultSchema, ColorSchema } from '@/types/analysis';

describe('AnalysisResultSchema', () => {
  it('should accept a valid analysis result', () => {
    const valid = {
      concept: '緊急性を煽るセール訴求',
      typography: '極太サンセリフ（ヒゲのない太い文字）',
      fontHints: ['Impact'],
      colors: [{ hex: '#FF0000', role: 'primary' }],
      composition: '中央配置',
      target: '通行人',
      extractedText: ['SALE'],
      category: 'pop',
      rawResponse: '{}',
    };
    expect(() => AnalysisResultSchema.parse(valid)).not.toThrow();
  });

  it('should reject an invalid HEX color', () => {
    const invalid = { hex: 'red', role: 'primary' };
    expect(() => ColorSchema.parse(invalid)).toThrow();
  });

  it('should reject an unknown category', () => {
    const invalid = {
      concept: 'x',
      typography: 'x',
      fontHints: [],
      colors: [],
      composition: 'x',
      target: 'x',
      extractedText: [],
      category: 'unknown',
      rawResponse: '{}',
    };
    expect(() => AnalysisResultSchema.parse(invalid)).toThrow();
  });

  const baseValid = {
    concept: '緊急性を煽るセール訴求',
    typography: '極太サンセリフ（ヒゲのない太い文字）',
    fontHints: ['Impact'],
    colors: [{ hex: '#FF0000', role: 'primary' }],
    composition: '中央配置',
    target: '通行人',
    extractedText: ['SALE'],
    category: 'pop',
    rawResponse: '{}',
  };

  it('should accept and retain the new journey fields', () => {
    const result = AnalysisResultSchema.parse({
      ...baseValid,
      visualFlow: 'まず中央の数字→次に商品名へ視線が動く',
      principles: [{ name: 'ジャンプ率', description: '文字の大小差で目を引く' }],
      improvements: ['コントラストを上げる'],
      applications: ['カフェの新メニュー告知'],
      textStyles: [
        {
          text: 'SALE',
          fontType: '極太サンセリフ',
          characteristics: '遠くからでも読める太い文字',
        },
      ],
    });

    expect(result.visualFlow).toBe('まず中央の数字→次に商品名へ視線が動く');
    expect(result.principles[0]).toEqual({
      name: 'ジャンプ率',
      description: '文字の大小差で目を引く',
    });
    expect(result.improvements).toEqual(['コントラストを上げる']);
    expect(result.applications).toEqual(['カフェの新メニュー告知']);
    expect(result.textStyles[0]).toEqual({
      text: 'SALE',
      fontType: '極太サンセリフ',
      characteristics: '遠くからでも読める太い文字',
    });
  });

  it('should default the new journey fields when missing (backward compatibility)', () => {
    const result = AnalysisResultSchema.parse(baseValid);

    expect(result.visualFlow).toBe('');
    expect(result.principles).toEqual([]);
    expect(result.improvements).toEqual([]);
    expect(result.applications).toEqual([]);
    expect(result.textStyles).toEqual([]);
  });

  it('should reject a principle without a name', () => {
    expect(() =>
      AnalysisResultSchema.parse({
        ...baseValid,
        principles: [{ description: '名前のない原則' }],
      }),
    ).toThrow();
  });
});
