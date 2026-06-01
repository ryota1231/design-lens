'use client';

import {
  CheckCircle2,
  Eye,
  Lightbulb,
  Palette,
  Sparkles,
  Tag,
  Type,
  Users,
  Wrench,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalysisResult } from '@/types/analysis';
import { ColorPalette } from './ColorPalette';

interface Props {
  analysis: Omit<AnalysisResult, 'rawResponse' | 'textStyles' | 'styleGenre'> & {
    rawResponse?: string;
    styleGenre?: string;
    textStyles?: AnalysisResult['textStyles'];
  };
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
  const conceptItems = splitSentences(analysis.concept);
  const textStyles = analysis.textStyles ?? [];

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
          <ul className="space-y-3">
            {conceptItems.map((item, index) => (
              <li key={`${item}-${index}`} className="flex min-w-0 gap-3">
                <CheckCircle2
                  aria-hidden
                  className="mt-1 h-5 w-5 shrink-0 text-[#8ee5bd]"
                />
                <span className="text-[17px] leading-8 font-bold break-words text-white sm:text-xl sm:leading-9">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <SectionCard icon={<Palette aria-hidden className="h-4 w-4" />} title={t('colors')}>
        <ColorPalette colors={analysis.colors} />
      </SectionCard>

      <SectionCard icon={<Type aria-hidden className="h-4 w-4" />} title={t('typography')}>
        {textStyles.length > 0 ? (
          <ul className="space-y-3">
            {textStyles.map((style, index) => (
              <li
                key={`${style.text}-${index}`}
                className="rounded-[1.25rem] border border-[#dff6f5] bg-[#fbfefd] p-3"
              >
                <p className="mb-3 inline-flex max-w-full rounded-full bg-[#dff6f5] px-3 py-1 text-sm font-bold break-words text-[#06727b]">
                  {style.text}
                </p>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-xs font-bold tracking-[0.08em] text-stone-500 uppercase">
                      {t('fontType')}
                    </dt>
                    <dd className="mt-1 font-bold break-words text-stone-900">
                      {style.fontType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold tracking-[0.08em] text-stone-500 uppercase">
                      {t('fontCharacteristics')}
                    </dt>
                    <dd className="mt-1 leading-7 break-words text-stone-700">
                      {style.characteristics}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <InsightList items={splitSentences(analysis.typography)} tone="mint" />
        )}
        {analysis.fontHints.length > 0 && (
          <div className="mt-4 rounded-2xl bg-[#f7f7f4] p-3">
            <p className="mb-2 text-xs font-bold text-stone-500">{t('fontHints')}</p>
            <div className="flex flex-wrap gap-2">
              {analysis.fontHints.map((hint, index) => (
                <span
                  key={`${hint}-${index}`}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-bold break-words text-stone-700 shadow-sm"
                >
                  {hint}
                </span>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard icon={<Users aria-hidden className="h-4 w-4" />} title={t('target')}>
        <InsightList items={splitSentences(analysis.target)} tone="gold" />
      </SectionCard>

      {analysis.visualFlow && (
        <SectionCard icon={<Eye aria-hidden className="h-4 w-4" />} title={t('visualFlow')}>
          <InsightList items={splitSentences(analysis.visualFlow)} tone="mint" />
        </SectionCard>
      )}

      {analysis.principles.length > 0 && (
        <SectionCard icon={<Lightbulb aria-hidden className="h-4 w-4" />} title={t('principles')}>
          <p className="mb-3 text-xs text-stone-500">{t('principlesHint')}</p>
          <ul className="space-y-2">
            {analysis.principles.map((principle, index) => (
              <li key={`${principle.name}-${index}`}>
                <details className="rounded-2xl bg-[#f7f7f4] px-3 py-2">
                  <summary className="cursor-pointer font-bold text-stone-800">
                    {principle.name}
                  </summary>
                  <p className="mt-2 text-sm leading-6 break-words text-stone-600">
                    {principle.description}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {analysis.improvements.length > 0 && (
        <SectionCard icon={<Wrench aria-hidden className="h-4 w-4" />} title={t('improvements')}>
          <InsightList items={analysis.improvements} tone="gold" />
        </SectionCard>
      )}

      {analysis.applications.length > 0 && (
        <SectionCard icon={<Sparkles aria-hidden className="h-4 w-4" />} title={t('applications')}>
          <InsightList items={analysis.applications} tone="mint" />
        </SectionCard>
      )}

      <p className="rounded-[1.25rem] border border-[#dfc49d] bg-[#faf6ee] px-4 py-3 text-sm leading-6 break-words text-stone-700">
        {t('noteAiInference')}
      </p>
    </div>
  );
}

function InsightList({ items, tone }: { items: string[]; tone: 'mint' | 'gold' }) {
  const colors =
    tone === 'mint'
      ? { dot: 'bg-[#00a862]', surface: 'bg-[#f0fbf6]', border: 'border-[#d4e9e2]' }
      : { dot: 'bg-[#cba258]', surface: 'bg-[#faf6ee]', border: 'border-[#dfc49d]' };

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className={`flex min-w-0 gap-3 rounded-2xl border px-3 py-3 ${colors.surface} ${colors.border}`}
        >
          <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${colors.dot}`} />
          <span className="min-w-0 leading-7 break-words">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function splitSentences(text: string): string[] {
  const normalized = text.trim();
  if (!normalized) return [];

  const sentences = normalized
    .split(/(?<=[。.!?！？])\s*/)
    .map((item) => item.trim())
    .filter(Boolean);

  return sentences.length > 0 ? sentences : [normalized];
}
