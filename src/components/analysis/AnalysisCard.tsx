'use client';

import { LayoutGrid, Palette, Tag, TextQuote, Type, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalysisResult } from '@/types/analysis';
import { ColorPalette } from './ColorPalette';

interface Props {
  analysis: Omit<AnalysisResult, 'rawResponse'> & { rawResponse?: string };
}

function SectionCard({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Card className="min-w-0 rounded-[1.5rem] border-white bg-white shadow-[0_0_1px_rgba(0,0,0,0.14),0_8px_18px_rgba(15,23,42,0.08)]">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="flex min-w-0 items-center gap-3 text-[17px] leading-tight text-stone-950">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dff6f5] text-[#06727b]">
            {icon}
          </span>
          <span className="min-w-0 break-words">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 p-5 pt-0 text-[15px] leading-8 break-words text-stone-700">
        {children}
      </CardContent>
    </Card>
  );
}

export function AnalysisCard({ analysis }: Props) {
  const t = useTranslations('analyze');

  return (
    <div className="min-w-0 space-y-4">
      <Card className="min-w-0 overflow-hidden rounded-[1.6rem] border-white bg-[#183d37] text-white shadow-[0_12px_26px_rgba(24,61,55,0.20)]">
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0 p-5 pb-3">
          <CardTitle className="text-[17px] leading-tight text-white">{t('concept')}</CardTitle>
          <div className="flex max-w-full shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/90">
            <Tag aria-hidden className="h-3.5 w-3.5" />
            <span>{t('category')}</span>
            <span className="font-bold">{t(`categories.${analysis.category}`)}</span>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 p-5 pt-0">
          <p className="text-[17px] leading-8 font-bold break-words text-white sm:text-xl sm:leading-9">
            {analysis.concept}
          </p>
        </CardContent>
      </Card>

      <SectionCard icon={<Palette aria-hidden className="h-4 w-4" />} title={t('colors')}>
        <ColorPalette colors={analysis.colors} />
      </SectionCard>

      <SectionCard icon={<Type aria-hidden className="h-4 w-4" />} title={t('typography')}>
        <p>{analysis.typography}</p>
        {analysis.fontHints.length > 0 && (
          <p className="mt-4 rounded-2xl bg-[#f7f7f4] p-3 text-sm leading-6 break-words text-stone-600">
            {analysis.fontHints.join(' / ')}
          </p>
        )}
      </SectionCard>

      <SectionCard icon={<LayoutGrid aria-hidden className="h-4 w-4" />} title={t('composition')}>
        <p>{analysis.composition}</p>
      </SectionCard>

      <SectionCard icon={<Users aria-hidden className="h-4 w-4" />} title={t('target')}>
        <p>{analysis.target}</p>
      </SectionCard>

      {analysis.extractedText.length > 0 && (
        <SectionCard
          icon={<TextQuote aria-hidden className="h-4 w-4" />}
          title={t('extractedText')}
        >
          <ul className="space-y-2">
            {analysis.extractedText.map((text, index) => (
              <li key={`${text}-${index}`} className="rounded-2xl bg-[#f7f7f4] px-3 py-2">
                {text}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <p className="rounded-[1.25rem] border border-[#dfc49d] bg-[#faf6ee] px-4 py-3 text-sm leading-6 break-words text-stone-700">
        {t('noteAiInference')}
      </p>
    </div>
  );
}
