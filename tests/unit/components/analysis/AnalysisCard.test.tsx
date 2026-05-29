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
      'analyze.visualFlow': '視線の流れ',
      'analyze.principles': 'デザイン原則',
      'analyze.principlesHint': 'タップで解説を見る',
      'analyze.colorDetails': '色の役割',
      'analyze.fontType': '推定フォント',
      'analyze.fontCharacteristics': '特徴',
      'analyze.fontHints': '候補',
      'analyze.improvements': 'もっと良くするなら',
      'analyze.applications': '応用アイデア',
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
  visualFlow: 'まず中央のロゴ→次に商品名へ視線が動く',
  principles: [{ name: 'ジャンプ率', description: '文字の大小差で目を引く' }],
  improvements: ['余白を増やすと上質に見えるかも'],
  applications: ['書店のフェアPOPにも応用できそう'],
  textStyles: [
    {
      text: 'SPRING SALE',
      fontType: '極太サンセリフ',
      characteristics: '遠くからでも読める力強い形',
    },
  ],
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

  it('shows the new journey fields', () => {
    render(<AnalysisCard analysis={analysis} />);

    expect(screen.getByText('視線の流れ')).toBeInTheDocument();
    expect(screen.getByText('まず中央のロゴ→次に商品名へ視線が動く')).toBeInTheDocument();
    expect(screen.getByText('ジャンプ率')).toBeInTheDocument();
    expect(screen.getByText('文字の大小差で目を引く')).toBeInTheDocument();
    expect(screen.getByText('余白を増やすと上質に見えるかも')).toBeInTheDocument();
    expect(screen.getByText('書店のフェアPOPにも応用できそう')).toBeInTheDocument();
  });

  it('shows colors as compact swatches and hides raw text/composition sections', () => {
    render(<AnalysisCard analysis={analysis} />);

    expect(screen.getAllByText('#ff3366').length).toBeGreaterThan(0);
    expect(screen.getByText('SPRING SALE')).toBeInTheDocument();
    expect(screen.getByText('極太サンセリフ')).toBeInTheDocument();
    expect(screen.getByText('遠くからでも読める力強い形')).toBeInTheDocument();
    expect(screen.queryByText('構図')).not.toBeInTheDocument();
    expect(screen.queryByText('デザイン中のテキスト')).not.toBeInTheDocument();
  });

  it('hides journey sections when their data is empty', () => {
    const empty: AnalysisResult = {
      ...analysis,
      visualFlow: '',
      principles: [],
      improvements: [],
      applications: [],
    };

    render(<AnalysisCard analysis={empty} />);

    expect(screen.queryByText('視線の流れ')).not.toBeInTheDocument();
    expect(screen.queryByText('デザイン原則')).not.toBeInTheDocument();
    expect(screen.queryByText('もっと良くするなら')).not.toBeInTheDocument();
    expect(screen.queryByText('応用アイデア')).not.toBeInTheDocument();
  });
});
