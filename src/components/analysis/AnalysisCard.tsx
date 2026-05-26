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
    <Card className="border-stone-200">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-stone-950">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-100 text-stone-700">
            {icon}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 text-sm leading-6 text-stone-700">{children}</CardContent>
    </Card>
  );
}

export function AnalysisCard({ analysis }: Props) {
  const t = useTranslations('analyze');

  return (
    <div className="space-y-4">
      <Card className="border-emerald-950 bg-emerald-950 text-white">
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-5 pb-3">
          <CardTitle className="text-base text-emerald-50">{t('concept')}</CardTitle>
          <div className="flex shrink-0 items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs text-emerald-50">
            <Tag aria-hidden className="h-3.5 w-3.5" />
            <span>{t('category')}</span>
            <span className="font-semibold">{t(`categories.${analysis.category}`)}</span>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <p className="text-xl leading-8 font-semibold">{analysis.concept}</p>
        </CardContent>
      </Card>

      <SectionCard icon={<Palette aria-hidden className="h-4 w-4" />} title={t('colors')}>
        <ColorPalette colors={analysis.colors} />
      </SectionCard>

      <SectionCard icon={<Type aria-hidden className="h-4 w-4" />} title={t('typography')}>
        <p>{analysis.typography}</p>
        {analysis.fontHints.length > 0 && (
          <p className="mt-3 rounded-md bg-stone-50 p-3 text-xs text-stone-600">
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
              <li key={`${text}-${index}`} className="rounded-md bg-stone-50 px-3 py-2">
                {text}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
        {t('noteAiInference')}
      </p>
    </div>
  );
}
