'use client';

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Color } from '@/types/analysis';

interface Props {
  colors: Color[];
}

export function ColorPalette({ colors }: Props) {
  const t = useTranslations('analyze');
  if (colors.length === 0) return null;

  return (
    <details className="group min-w-0 rounded-[1.25rem] border border-stone-200 bg-[#fafafa] p-3">
      <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <div className="grid min-w-0 flex-1 grid-cols-3 gap-2 min-[360px]:grid-cols-4">
          {colors.slice(0, 8).map((color, index) => (
            <div
              key={`${color.hex}-${index}`}
              className="min-w-0 rounded-2xl border border-white bg-white p-2 shadow-[0_1px_4px_rgba(15,23,42,0.08)]"
            >
              <div
                className="mb-2 aspect-square rounded-xl border border-stone-200"
                style={{ backgroundColor: color.hex }}
                aria-label={`${color.hex} - ${color.role}`}
              />
              <span className="block truncate font-mono text-[11px] font-bold text-stone-950">
                {color.hex}
              </span>
            </div>
          ))}
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-stone-600 shadow-sm transition-transform group-open:rotate-180">
          <ChevronDown aria-hidden className="h-4 w-4" />
        </span>
      </summary>

      <div className="mt-3 space-y-2 border-t border-stone-200 pt-3">
        <p className="text-xs font-bold text-stone-500">{t('colorDetails')}</p>
        {colors.map((color, index) => (
          <div
            key={`${color.hex}-detail-${index}`}
            className="flex min-w-0 items-start gap-3 rounded-2xl bg-white p-3"
          >
            <div
              className="h-10 w-10 shrink-0 rounded-xl border border-stone-200"
              style={{ backgroundColor: color.hex }}
            />
            <div className="min-w-0">
              <span className="block font-mono text-sm font-bold text-stone-950">{color.hex}</span>
              <span className="block text-sm leading-6 break-words text-stone-600">
                {color.role}
              </span>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
