import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { DesignLensDB } from '@/lib/db/schema';

describe('DesignLensDB', () => {
  let db: DesignLensDB;

  beforeEach(async () => {
    db = new DesignLensDB();
    await db.open();
    await db.photos.clear();
    await db.analyses.clear();
    await db.prompts.clear();
  });

  it('should store and retrieve a photo', async () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' });
    await db.photos.add({
      id: 'photo-1',
      blob,
      thumbnailBlob: blob,
      createdAt: Date.now(),
    });
    const photo = await db.photos.get('photo-1');
    expect(photo).toBeDefined();
    expect(photo!.id).toBe('photo-1');
  });

  it('should store and retrieve a data URL photo fallback', async () => {
    await db.photos.add({
      id: 'photo-data-url-1',
      imageDataUrl: 'data:image/jpeg;base64,eA==',
      thumbnailDataUrl: 'data:image/jpeg;base64,eA==',
      createdAt: Date.now(),
    });
    const photo = await db.photos.get('photo-data-url-1');
    expect(photo?.imageDataUrl).toBe('data:image/jpeg;base64,eA==');
  });

  it('should query analyses by photoId', async () => {
    await db.analyses.add({
      id: 'a-1',
      photoId: 'photo-1',
      concept: 'c',
      typography: 't',
      fontHints: [],
      colors: [],
      composition: 'x',
      target: 'x',
      extractedText: [],
      category: 'other',
      visualFlow: '',
      principles: [],
      improvements: [],
      applications: [],
      language: 'ja',
      rawResponse: '{}',
      createdAt: Date.now(),
    });
    const list = await db.analyses.where('photoId').equals('photo-1').toArray();
    expect(list).toHaveLength(1);
  });
});
