import Dexie, { type Table } from 'dexie';
import type { Category, Principle, TextStyle } from '@/types/analysis';

export interface PhotoRecord {
  id: string;
  blob?: Blob;
  thumbnailBlob?: Blob;
  imageDataUrl?: string;
  thumbnailDataUrl?: string;
  createdAt: number;
}

export interface AnalysisRecord {
  id: string;
  photoId: string;
  concept: string;
  styleGenre?: string;
  typography: string;
  fontHints: string[];
  colors: Array<{ hex: string; role: string }>;
  composition: string;
  target: string;
  extractedText: string[];
  category: Category;
  visualFlow: string;
  principles: Principle[];
  improvements: string[];
  applications: string[];
  textStyles?: TextStyle[];
  language: 'ja' | 'en';
  rawResponse: string;
  createdAt: number;
}

export interface PromptRecord {
  id: string;
  analysisId: string;
  prompt: string;
  createdAt: number;
}

export class DesignLensDB extends Dexie {
  photos!: Table<PhotoRecord, string>;
  analyses!: Table<AnalysisRecord, string>;
  prompts!: Table<PromptRecord, string>;

  constructor() {
    super('design-lens');
    this.version(1).stores({
      photos: 'id, createdAt',
      analyses: 'id, photoId, createdAt, category',
      prompts: 'id, analysisId, createdAt',
    });
  }
}

export const db = new DesignLensDB();
