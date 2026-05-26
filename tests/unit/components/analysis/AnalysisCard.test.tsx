import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnalysisCard } from '@/components/analysis/AnalysisCard';
import type { AnalysisResult } from '@/types/analysis';

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    const messages: Record<string, string> = {
      'analyze.category': 'カテゴリ',
      'analyze.colors': '配色',
      'analyze.composition': '構図',
      'analyze.concept': '設計意図',
      'analyze.extractedText': 'デザイン中のテキスト',
      'analyze.noteAiInference': '※AIによる観察と推測です。正解ではありません。',
      'analyze.target': '想定ターゲット',
      'analyze.typography': '文字の特徴',
      'analyze.categories.pop': 'POP',
    };

    return messages[namespace ? `${namespace}.${key}` : key] ?? key;
  },
}));

const analysis: AnalysisResult = {
  concept: '季節限定の楽しさをすぐ伝える設計',
  typography: '太く読みやすい文字',
  fontHints: ['ヒゲのない太い文字（極太サンセリフ）'],
  colors: [{ hex: '#ff3366', role: '注目色' }],
  composition: '中心に大きく置く構図',
  target: '通行中の若い買い物客',
  extractedText: ['SPRING SALE'],
  category: 'pop',
  rawResponse: '{}',
};

describe('AnalysisCard', () => {
  it('shows the category label and translated category name', () => {
    render(<AnalysisCard analysis={analysis} />);

    expect(screen.getByText('カテゴリ')).toBeInTheDocument();
    expect(screen.getByText('POP')).toBeInTheDocument();
  });

  it('keeps the AI inference note visible', () => {
    render(<AnalysisCard analysis={analysis} />);

    expect(screen.getByText('※AIによる観察と推測です。正解ではありません。')).toBeInTheDocument();
  });
});
