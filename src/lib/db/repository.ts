import type { AnalysisResult } from '@/types/analysis';
import { db, type AnalysisRecord, type PhotoRecord, type PromptRecord } from './schema';

function uuid(): string {
  return crypto.randomUUID();
}

export async function savePhotoWithAnalysis(args: {
  blob: Blob;
  thumbnailBlob: Blob;
  analysis: AnalysisResult;
  language: 'ja' | 'en';
}): Promise<{ photoId: string; analysisId: string }> {
  const photoId = uuid();
  const analysisId = uuid();
  const now = Date.now();

  await db.transaction('rw', db.photos, db.analyses, async () => {
    await db.photos.add({
      id: photoId,
      blob: args.blob,
      thumbnailBlob: args.thumbnailBlob,
      createdAt: now,
    });
    await db.analyses.add({
      id: analysisId,
      photoId,
      ...args.analysis,
      language: args.language,
      createdAt: now,
    });
  });

  return { photoId, analysisId };
}

export async function listRecentAnalyses(args: { limit: number }): Promise<AnalysisRecord[]> {
  return db.analyses.orderBy('createdAt').reverse().limit(args.limit).toArray();
}

export async function getAnalysisWithPhoto(
  analysisId: string,
): Promise<{ analysis: AnalysisRecord; photo: PhotoRecord | undefined } | null> {
  const analysis = await db.analyses.get(analysisId);
  if (!analysis) return null;

  const photo = await db.photos.get(analysis.photoId);
  return { analysis, photo };
}

export async function savePrompt(args: {
  analysisId: string;
  prompt: string;
}): Promise<PromptRecord> {
  const record: PromptRecord = {
    id: uuid(),
    analysisId: args.analysisId,
    prompt: args.prompt,
    createdAt: Date.now(),
  };

  await db.prompts.add(record);
  return record;
}

export async function getPromptByAnalysisId(
  analysisId: string,
): Promise<PromptRecord | undefined> {
  return db.prompts.where('analysisId').equals(analysisId).first();
}
