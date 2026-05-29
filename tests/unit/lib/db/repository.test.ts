import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  visualFlow: '',
  principles: [],
  improvements: [],
  applications: [],
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

  it('should save photo when crypto.randomUUID is unavailable', async () => {
    const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        getRandomValues: (array: Uint8Array) => {
          for (let i = 0; i < array.length; i += 1) {
            array[i] = i + 1;
          }
          return array;
        },
      },
    });

    try {
      const blob = new Blob(['x'], { type: 'image/jpeg' });
      const { photoId, analysisId } = await savePhotoWithAnalysis({
        blob,
        thumbnailBlob: blob,
        analysis: sampleAnalysis,
        language: 'ja',
      });

      expect(photoId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      expect(await db.analyses.get(analysisId)).toBeDefined();
    } finally {
      if (cryptoDescriptor) {
        Object.defineProperty(globalThis, 'crypto', cryptoDescriptor);
      }
    }
  });

  it('should fall back to data URL storage when Blob storage fails', async () => {
    const originalAdd = db.photos.add.bind(db.photos);
    const addSpy = vi.spyOn(db.photos, 'add');
    type PhotoAddResult = ReturnType<typeof db.photos.add>;
    addSpy
      .mockImplementationOnce(() => Promise.reject(new Error('Blob storage failed')) as PhotoAddResult)
      .mockImplementation((record) => originalAdd(record));

    try {
      const blob = new Blob(['x'], { type: 'image/jpeg' });
      const { photoId } = await savePhotoWithAnalysis({
        blob,
        thumbnailBlob: blob,
        analysis: sampleAnalysis,
        language: 'ja',
      });

      const photo = await db.photos.get(photoId);
      expect(photo?.blob).toBeUndefined();
      expect(photo?.imageDataUrl).toMatch(/^data:image\/jpeg;base64,/);
      expect(photo?.thumbnailDataUrl).toMatch(/^data:image\/jpeg;base64,/);
    } finally {
      addSpy.mockRestore();
    }
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
