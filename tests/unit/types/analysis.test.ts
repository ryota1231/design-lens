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
});
