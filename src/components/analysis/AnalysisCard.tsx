'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalysisResult } from '@/types/analysis';
import { ColorPalette } from './ColorPalette';

interface Props {
  analysis: Omit<AnalysisResult, 'rawResponse'> & { rawResponse?: string };
}

export function AnalysisCard({ analysis }: Props) {
  const t = useTranslations('analyze');

  return (
    <div className="space-y-4">
      <Card className="border-2 border-black">
        <CardHeader>
          <CardTitle>{t('concept')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed">{analysis.concept}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('colors')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ColorPalette colors={analysis.colors} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('typography')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{analysis.typography}</p>
          {analysis.fontHints.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">{analysis.fontHints.join(' / ')}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('composition')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{analysis.composition}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('target')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{analysis.target}</p>
        </CardContent>
      </Card>

      {analysis.extractedText.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('extractedText')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc text-sm">
              {analysis.extractedText.map((text, index) => (
                <li key={`${text}-${index}`}>{text}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="mt-4 text-xs text-gray-500">{t('noteAiInference')}</p>
    </div>
  );
}
