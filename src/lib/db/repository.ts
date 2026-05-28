import type { AnalysisResult } from '@/types/analysis';
import { db, type AnalysisRecord, type PhotoRecord, type PromptRecord } from './schema';

function uuid(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
    .slice(6, 8)
    .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
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

  try {
    await savePhotoRecord({
      photoId,
      analysisId,
      now,
      photo: {
        id: photoId,
        blob: args.blob,
        thumbnailBlob: args.thumbnailBlob,
        createdAt: now,
      },
      analysis: args.analysis,
      language: args.language,
    });
  } catch (blobError) {
    console.warn('[db] Blob保存に失敗したためData URL保存へ切り替えます', blobError);
    await savePhotoRecord({
      photoId,
      analysisId,
      now,
      photo: {
        id: photoId,
        imageDataUrl: await blobToDataUrl(args.blob),
        thumbnailDataUrl: await blobToDataUrl(args.thumbnailBlob),
        createdAt: now,
      },
      analysis: args.analysis,
      language: args.language,
    });
  }

  return { photoId, analysisId };
}

async function savePhotoRecord(args: {
  photoId: string;
  analysisId: string;
  now: number;
  photo: PhotoRecord;
  analysis: AnalysisResult;
  language: 'ja' | 'en';
}): Promise<void> {
  await db.transaction('rw', db.photos, db.analyses, async () => {
    await db.photos.add(args.photo);
    await db.analyses.add({
      id: args.analysisId,
      photoId: args.photoId,
      ...args.analysis,
      language: args.language,
      createdAt: args.now,
    });
  });
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

  await db.transaction('rw', db.prompts, async () => {
    await db.prompts.where('analysisId').equals(args.analysisId).delete();
    await db.prompts.add(record);
  });
  return record;
}

export async function getPromptByAnalysisId(
  analysisId: string,
): Promise<PromptRecord | undefined> {
  return db.prompts.where('analysisId').equals(analysisId).first();
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
