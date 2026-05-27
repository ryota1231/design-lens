import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/lib/db/schema';
import {
  getAnalysisWithPhoto,
  getPromptByAnalysisId,
  listRecentAnalyses,
  savePhotoWithAnalysis,
  savePrompt,
} from '@/lib/db/repository';
import type { AnalysisResult } from '@/types/analysis';

const sampleAnalysis: AnalysisResult = {
  concept: 'セール訴求',
  typography: '極太サンセリフ',
  fontHints: ['Impact'],
  colors: [{ hex: '#FF0000', role: 'primary' }],
  composition: '中央',
  target: '通行人',
  extractedText: ['SALE'],
  category: 'pop',
  rawResponse: '{}',
};

describe('repository', () => {
  beforeEach(async () => {
    await db.open();
    await db.photos.clear();
    await db.analyses.clear();
    await db.prompts.clear();
  });

  it('should save photo with analysis atomically', async () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' });
    const { photoId, analysisId } = await savePhotoWithAnalysis({
      blob,
      thumbnailBlob: blob,
      analysis: sampleAnalysis,
      language: 'ja',
    });

    expect(photoId).toBeTruthy();
    expect(analysisId).toBeTruthy();
    const a = await db.analyses.get(analysisId);
    expect(a?.concept).toBe('セール訴求');
  });

  it('should list recent analyses', async () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' });
    for (let i = 0; i < 3; i += 1) {
      await savePhotoWithAnalysis({
        blob,
        thumbnailBlob: blob,
        analysis: { ...sampleAnalysis, concept: `c-${i}` },
        language: 'ja',
      });
    }
    const recent = await listRecentAnalyses({ limit: 10 });
    expect(recent).toHaveLength(3);
  });

  it('should fetch analysis with linked photo', async () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' });
    const { analysisId } = await savePhotoWithAnalysis({
      blob,
      thumbnailBlob: blob,
      analysis: sampleAnalysis,
      language: 'ja',
    });
    const result = await getAnalysisWithPhoto(analysisId);
    expect(result?.analysis.id).toBe(analysisId);
    expect(result?.photo).toBeDefined();
  });

  it('should replace an existing prompt for the same analysis', async () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' });
    const { analysisId } = await savePhotoWithAnalysis({
      blob,
      thumbnailBlob: blob,
      analysis: sampleAnalysis,
      language: 'ja',
    });

    await savePrompt({ analysisId, prompt: 'English prompt' });
    await savePrompt({ analysisId, prompt: '日本語のプロンプト' });

    const prompt = await getPromptByAnalysisId(analysisId);
    expect(prompt?.prompt).toBe('日本語のプロンプト');
    expect(await db.prompts.where('analysisId').equals(analysisId).count()).toBe(1);
  });
});
