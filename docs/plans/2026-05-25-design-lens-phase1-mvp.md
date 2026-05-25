# Design Lens Phase 1 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 街中で撮影したデザインを Claude Vision で解析し、ローカル保存と再現プロンプト生成までを完結する PWA（Web版MVP）を構築する。

**Architecture:** オールインワン Next.js（App Router + API Routes）。フロントエンドは PWA として React で実装し、IndexedDB（Dexie.js）にローカル保存。AI解析は API Routes 経由で Claude API（Anthropic SDK）を呼び出す。Vercel で無料デプロイ。

**Tech Stack:**
- Next.js 15+（App Router）+ TypeScript
- React 19 + Tailwind CSS + shadcn/ui
- next-pwa（Service Worker / PWA化）
- next-intl（日本語/英語 i18n）
- Dexie.js（IndexedDB ラッパ）
- Anthropic SDK（Claude Sonnet 4.5 Vision）
- Zod（型検証）
- Zustand（状態管理）
- Vitest + Testing Library + msw（単体・統合）
- Playwright（E2E）
- pnpm（パッケージマネージャ）

**Reference Spec:** `docs/specs/2026-05-25-design-lens-spec.md`

---

## 全体ファイル構成（最終形）

実装完了後に存在するべきファイル一覧。各タスクで段階的に作成する。

```
design-lens/
├── docs/
│   ├── specs/2026-05-25-design-lens-spec.md      (既存)
│   └── plans/2026-05-25-design-lens-phase1-mvp.md (本ファイル)
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx                         # ルートレイアウト
│   │   │   ├── page.tsx                           # ホーム（撮影ボタン）
│   │   │   ├── analyze/[id]/page.tsx              # 解析結果画面
│   │   │   └── archive/page.tsx                   # ローカル保存一覧
│   │   ├── api/
│   │   │   ├── analyze/route.ts                   # POST /api/analyze
│   │   │   └── prompt/route.ts                    # POST /api/prompt
│   │   ├── manifest.ts                            # PWA manifest
│   │   └── globals.css                            # Tailwindベーススタイル
│   ├── components/
│   │   ├── ui/                                    # shadcn/ui components
│   │   ├── camera/
│   │   │   ├── CameraCapture.tsx
│   │   │   └── useCamera.ts
│   │   ├── analysis/
│   │   │   ├── AnalysisCard.tsx
│   │   │   └── ColorPalette.tsx
│   │   ├── archive/
│   │   │   └── PhotoGrid.tsx
│   │   └── common/
│   │       ├── LanguageSwitcher.tsx
│   │       └── ErrorBoundary.tsx
│   ├── lib/
│   │   ├── claude/
│   │   │   ├── client.ts                          # Anthropic SDK wrapper
│   │   │   └── prompts.ts                         # システムプロンプト
│   │   ├── db/
│   │   │   ├── schema.ts                          # Dexie schema
│   │   │   └── repository.ts                      # CRUD helpers
│   │   ├── image/
│   │   │   └── compress.ts                        # 画像圧縮
│   │   ├── rate-limit/
│   │   │   └── memory-store.ts                    # In-memory rate limiter
│   │   └── i18n/
│   │       ├── config.ts
│   │       └── routing.ts
│   ├── messages/
│   │   ├── ja.json
│   │   └── en.json
│   ├── types/
│   │   └── analysis.ts                            # Zod schema + types
│   └── middleware.ts                              # next-intl middleware
├── tests/
│   ├── unit/
│   │   ├── lib/db/repository.test.ts
│   │   ├── lib/image/compress.test.ts
│   │   ├── lib/rate-limit/memory-store.test.ts
│   │   └── lib/claude/client.test.ts
│   ├── integration/
│   │   ├── api/analyze.test.ts
│   │   └── api/prompt.test.ts
│   └── e2e/
│       └── capture-flow.spec.ts
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
├── .env.example
├── .env.local                                     # gitignore対象
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── vitest.config.ts
├── playwright.config.ts
├── package.json
└── README.md
```

---

## Task 1: Next.jsプロジェクト初期化

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `src/app/layout.tsx`（一時版）
- Create: `src/app/page.tsx`（一時版）

- [ ] **Step 1.1: pnpm の有無を確認、なければインストール**

```bash
which pnpm || npm install -g pnpm
pnpm --version
```

Expected: バージョン番号が表示される（例: `9.x.x`）

- [ ] **Step 1.2: Next.js プロジェクトを `--skip-install` で生成**

`design-lens/` 直下で実行：

```bash
cd "/Users/ryota.isomoto/Documents/New project 5/design-lens"
pnpm create next-app@latest . --typescript --tailwind --app --src-dir --no-import-alias --eslint --skip-install
```

対話プロンプトには以下で応答（自動付与されない場合）:
- Would you like to use Turbopack? → No（初期は安定性優先）
- Would you like to customize the import alias? → No

既存の `docs/` や `.gitignore` を上書きしないよう確認。上書き警告が出たら **No** を選択。

- [ ] **Step 1.3: 依存をインストール**

```bash
pnpm install
```

Expected: `node_modules/` が生成され、エラーなく完了。

- [ ] **Step 1.4: 動作確認**

```bash
pnpm dev
```

Expected: `http://localhost:3000` で Next.js デフォルトページが表示される。確認後 `Ctrl+C` で停止。

- [ ] **Step 1.5: コミット**

```bash
git add .
git commit -m "feat: Next.js + TypeScript + Tailwind プロジェクトを初期化"
```

---

## Task 2: ESLint・Prettier・Vitest セットアップ

**Files:**
- Create: `.prettierrc.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Modify: `package.json`（scripts 追加）

- [ ] **Step 2.1: 開発依存をインストール**

```bash
pnpm add -D prettier prettier-plugin-tailwindcss vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 2.2: `.prettierrc.json` を作成**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Step 2.3: `vitest.config.ts` を作成**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 2.4: `tests/setup.ts` を作成**

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 2.5: `package.json` の `scripts` を追記**

`package.json` の `"scripts"` セクションに以下を追加：

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

- [ ] **Step 2.6: ダミーテストで起動確認**

`tests/unit/sanity.test.ts` を作成:

```typescript
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });
});
```

実行:

```bash
pnpm test
```

Expected: `1 passed` と表示される。

- [ ] **Step 2.7: コミット**

```bash
git add .
git commit -m "feat: Prettier + Vitest + Testing Library のセットアップ"
```

---

## Task 3: 型定義（Zodスキーマ）

**Files:**
- Create: `src/types/analysis.ts`
- Create: `tests/unit/types/analysis.test.ts`

- [ ] **Step 3.1: Zod をインストール**

```bash
pnpm add zod
```

- [ ] **Step 3.2: テストを先に書く**

`tests/unit/types/analysis.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { AnalysisResultSchema, ColorSchema } from '@/types/analysis';

describe('AnalysisResultSchema', () => {
  it('should accept a valid analysis result', () => {
    const valid = {
      concept: '緊急性を煽るセール訴求',
      typography: '極太サンセリフ（ヒゲのない太い文字）',
      fontHints: ['Impact'],
      colors: [{ hex: '#FF0000', role: 'primary' }],
      composition: '中央配置',
      target: '通行人',
      extractedText: ['SALE'],
      category: 'pop',
      rawResponse: '{}',
    };
    expect(() => AnalysisResultSchema.parse(valid)).not.toThrow();
  });

  it('should reject an invalid HEX color', () => {
    const invalid = { hex: 'red', role: 'primary' };
    expect(() => ColorSchema.parse(invalid)).toThrow();
  });

  it('should reject an unknown category', () => {
    const invalid = {
      concept: 'x',
      typography: 'x',
      fontHints: [],
      colors: [],
      composition: 'x',
      target: 'x',
      extractedText: [],
      category: 'unknown',
      rawResponse: '{}',
    };
    expect(() => AnalysisResultSchema.parse(invalid)).toThrow();
  });
});
```

- [ ] **Step 3.3: テストが失敗することを確認**

```bash
pnpm test analysis
```

Expected: `FAIL` — `@/types/analysis` が見つからない。

- [ ] **Step 3.4: スキーマを実装**

`src/types/analysis.ts`:

```typescript
import { z } from 'zod';

export const ColorSchema = z.object({
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'HEXコード形式である必要があります'),
  role: z.string(),
});

export const CategorySchema = z.enum(['sign', 'logo', 'pop', 'signage', 'other']);

export const AnalysisResultSchema = z.object({
  concept: z.string().min(1),
  typography: z.string().min(1),
  fontHints: z.array(z.string()),
  colors: z.array(ColorSchema),
  composition: z.string().min(1),
  target: z.string().min(1),
  extractedText: z.array(z.string()),
  category: CategorySchema,
  rawResponse: z.string(),
});

export const AnalyzeRequestSchema = z.object({
  image: z.string().startsWith('data:image/', '画像のdata URLである必要があります'),
  language: z.enum(['ja', 'en']),
});

export const PromptRequestSchema = z.object({
  analysis: AnalysisResultSchema.omit({ rawResponse: true }),
  language: z.enum(['ja', 'en']),
});

export const PromptResponseSchema = z.object({
  prompt: z.string().min(1),
});

export type Color = z.infer<typeof ColorSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type PromptRequest = z.infer<typeof PromptRequestSchema>;
export type PromptResponse = z.infer<typeof PromptResponseSchema>;
```

- [ ] **Step 3.5: テストがパスすることを確認**

```bash
pnpm test analysis
```

Expected: `3 passed`

- [ ] **Step 3.6: コミット**

```bash
git add .
git commit -m "feat: Analysis / Color / Category などの Zod スキーマと型を定義"
```

---

## Task 4: IndexedDB スキーマ（Dexie.js）

**Files:**
- Create: `src/lib/db/schema.ts`
- Create: `tests/unit/lib/db/schema.test.ts`

- [ ] **Step 4.1: Dexie をインストール**

```bash
pnpm add dexie dexie-react-hooks
pnpm add -D fake-indexeddb
```

- [ ] **Step 4.2: テストを書く**

`tests/unit/lib/db/schema.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
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
      language: 'ja',
      rawResponse: '{}',
      createdAt: Date.now(),
    });
    const list = await db.analyses.where('photoId').equals('photo-1').toArray();
    expect(list).toHaveLength(1);
  });
});
```

- [ ] **Step 4.3: テストが失敗することを確認**

```bash
pnpm test db/schema
```

Expected: `FAIL` — `@/lib/db/schema` が見つからない。

- [ ] **Step 4.4: スキーマを実装**

`src/lib/db/schema.ts`:

```typescript
import Dexie, { type Table } from 'dexie';
import type { Category } from '@/types/analysis';

export interface PhotoRecord {
  id: string;
  blob: Blob;
  thumbnailBlob: Blob;
  createdAt: number;
}

export interface AnalysisRecord {
  id: string;
  photoId: string;
  concept: string;
  typography: string;
  fontHints: string[];
  colors: Array<{ hex: string; role: string }>;
  composition: string;
  target: string;
  extractedText: string[];
  category: Category;
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
```

- [ ] **Step 4.5: テストがパスすることを確認**

```bash
pnpm test db/schema
```

Expected: `2 passed`

- [ ] **Step 4.6: コミット**

```bash
git add .
git commit -m "feat: Dexie.js による IndexedDB スキーマ定義（photos / analyses / prompts）"
```

---

## Task 5: DB Repository 層

**Files:**
- Create: `src/lib/db/repository.ts`
- Create: `tests/unit/lib/db/repository.test.ts`

- [ ] **Step 5.1: テストを書く**

`tests/unit/lib/db/repository.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/lib/db/schema';
import { savePhotoWithAnalysis, listRecentAnalyses, getAnalysisWithPhoto } from '@/lib/db/repository';
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
    for (let i = 0; i < 3; i++) {
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
});
```

- [ ] **Step 5.2: テストが失敗することを確認**

```bash
pnpm test repository
```

Expected: `FAIL` — `@/lib/db/repository` が見つからない。

- [ ] **Step 5.3: Repository を実装**

`src/lib/db/repository.ts`:

```typescript
import { db, type AnalysisRecord, type PhotoRecord, type PromptRecord } from './schema';
import type { AnalysisResult } from '@/types/analysis';

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

export async function getPromptByAnalysisId(analysisId: string): Promise<PromptRecord | undefined> {
  return db.prompts.where('analysisId').equals(analysisId).first();
}
```

- [ ] **Step 5.4: テストがパスすることを確認**

```bash
pnpm test repository
```

Expected: `3 passed`

- [ ] **Step 5.5: コミット**

```bash
git add .
git commit -m "feat: DB Repository 層（savePhotoWithAnalysis / listRecentAnalyses 等）"
```

---

## Task 6: 画像圧縮ユーティリティ

**Files:**
- Create: `src/lib/image/compress.ts`
- Create: `tests/unit/lib/image/compress.test.ts`

- [ ] **Step 6.1: テストを書く**

`tests/unit/lib/image/compress.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { calculateResizeDimensions, blobToDataUrl } from '@/lib/image/compress';

describe('calculateResizeDimensions', () => {
  it('should preserve aspect ratio (landscape)', () => {
    const result = calculateResizeDimensions({ width: 2000, height: 1000, maxLongSide: 1024 });
    expect(result).toEqual({ width: 1024, height: 512 });
  });

  it('should preserve aspect ratio (portrait)', () => {
    const result = calculateResizeDimensions({ width: 1000, height: 2000, maxLongSide: 1024 });
    expect(result).toEqual({ width: 512, height: 1024 });
  });

  it('should not upscale smaller images', () => {
    const result = calculateResizeDimensions({ width: 500, height: 300, maxLongSide: 1024 });
    expect(result).toEqual({ width: 500, height: 300 });
  });
});

describe('blobToDataUrl', () => {
  it('should convert a small Blob to a data URL', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    const dataUrl = await blobToDataUrl(blob);
    expect(dataUrl.startsWith('data:text/plain')).toBe(true);
  });
});
```

- [ ] **Step 6.2: テストが失敗することを確認**

```bash
pnpm test image/compress
```

Expected: `FAIL`

- [ ] **Step 6.3: 実装**

`src/lib/image/compress.ts`:

```typescript
/**
 * 画像のリサイズ後の寸法を計算（アスペクト比保持）
 */
export function calculateResizeDimensions(args: {
  width: number;
  height: number;
  maxLongSide: number;
}): { width: number; height: number } {
  const { width, height, maxLongSide } = args;
  if (width <= maxLongSide && height <= maxLongSide) {
    return { width, height };
  }
  const ratio = width >= height ? maxLongSide / width : maxLongSide / height;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Blob を data URL に変換
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * HTMLImageElement を指定サイズで Canvas に描画し、JPEG Blob で返す
 * ブラウザ環境（document）が前提
 */
export async function compressImage(args: {
  source: Blob;
  maxLongSide: number;
  quality?: number;
}): Promise<Blob> {
  const { source, maxLongSide, quality = 0.85 } = args;

  const objectUrl = URL.createObjectURL(source);
  try {
    const img = await loadImage(objectUrl);
    const dim = calculateResizeDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
      maxLongSide,
    });

    const canvas = document.createElement('canvas');
    canvas.width = dim.width;
    canvas.height = dim.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d context が取得できません');
    ctx.drawImage(img, 0, 0, dim.width, dim.height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob が null を返しました'))),
        'image/jpeg',
        quality,
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('画像読み込み失敗'));
    img.src = src;
  });
}
```

- [ ] **Step 6.4: テストがパスすることを確認**

```bash
pnpm test image/compress
```

Expected: `4 passed`

- [ ] **Step 6.5: コミット**

```bash
git add .
git commit -m "feat: 画像圧縮ユーティリティ（リサイズ計算、Blob→DataURL、Canvas圧縮）"
```

---

## Task 7: レート制限ストア（in-memory）

**Files:**
- Create: `src/lib/rate-limit/memory-store.ts`
- Create: `tests/unit/lib/rate-limit/memory-store.test.ts`

- [ ] **Step 7.1: テストを書く**

`tests/unit/lib/rate-limit/memory-store.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createRateLimiter } from '@/lib/rate-limit/memory-store';

describe('rate-limit memory-store', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('should allow requests within the limit', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
    expect(limiter.check('ip-1').ok).toBe(true);
    expect(limiter.check('ip-1').ok).toBe(true);
    expect(limiter.check('ip-1').ok).toBe(true);
  });

  it('should block when limit exceeded', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
    limiter.check('ip-1');
    limiter.check('ip-1');
    const r = limiter.check('ip-1');
    expect(r.ok).toBe(false);
    expect(r.retryAfterMs).toBeGreaterThan(0);
  });

  it('should reset after window expires', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(limiter.check('ip-1').ok).toBe(true);
    expect(limiter.check('ip-1').ok).toBe(false);
    vi.advanceTimersByTime(61_000);
    expect(limiter.check('ip-1').ok).toBe(true);
  });

  it('should track different keys independently', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(limiter.check('ip-1').ok).toBe(true);
    expect(limiter.check('ip-2').ok).toBe(true);
  });
});
```

- [ ] **Step 7.2: テスト失敗確認**

```bash
pnpm test rate-limit
```

Expected: `FAIL`

- [ ] **Step 7.3: 実装**

`src/lib/rate-limit/memory-store.ts`:

```typescript
interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterMs: number;
  remaining: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

/**
 * In-memory 固定ウィンドウ方式のレート制限。
 * Vercel serverless では各インスタンスでメモリが分離されるが、
 * 個人開発・低トラフィック前提の「コスト保護」用途では十分。
 */
export function createRateLimiter(opts: { limit: number; windowMs: number }): RateLimiter {
  const buckets = new Map<string, Bucket>();

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const existing = buckets.get(key);

      if (!existing || existing.resetAt <= now) {
        const fresh: Bucket = { count: 1, resetAt: now + opts.windowMs };
        buckets.set(key, fresh);
        return { ok: true, retryAfterMs: 0, remaining: opts.limit - 1 };
      }

      if (existing.count >= opts.limit) {
        return {
          ok: false,
          retryAfterMs: existing.resetAt - now,
          remaining: 0,
        };
      }

      existing.count += 1;
      return { ok: true, retryAfterMs: 0, remaining: opts.limit - existing.count };
    },
  };
}

/**
 * /api/analyze 用のシングルトン（1時間に20回まで）。
 */
export const analyzeRateLimiter = createRateLimiter({
  limit: 20,
  windowMs: 60 * 60 * 1000,
});
```

- [ ] **Step 7.4: テスト通過確認**

```bash
pnpm test rate-limit
```

Expected: `4 passed`

- [ ] **Step 7.5: コミット**

```bash
git add .
git commit -m "feat: in-memory レート制限（固定ウィンドウ方式）"
```

---

## Task 8: Claude API クライアント

**Files:**
- Create: `src/lib/claude/prompts.ts`
- Create: `src/lib/claude/client.ts`
- Create: `tests/unit/lib/claude/client.test.ts`

- [ ] **Step 8.1: Anthropic SDK をインストール**

```bash
pnpm add @anthropic-ai/sdk
```

- [ ] **Step 8.2: プロンプト設計を作成**

`src/lib/claude/prompts.ts`:

```typescript
/**
 * 解析用のシステムプロンプト。
 * 仕様書 0.3「設計原則」と 11.7「UI/UX原則」を反映：
 *   - 専門用語と日常語の併記
 *   - 「観察と推測」のトーン
 *   - 設計意図を主役に
 */
export function buildAnalyzeSystemPrompt(language: 'ja' | 'en'): string {
  if (language === 'ja') {
    return `あなたはデザインの観察者・解説者です。送られた画像（街中の看板・ロゴ・POP・サイネージ等）を観察し、設計意図を中心に解説してください。

【出力ルール】
1. すべて「観察と推測」のトーンで述べる（断定せず「〜のように見える」「〜の意図と思われる」）
2. 専門用語を使うときは必ず日常語と併記する（例: 「ヒゲのない太い文字（極太サンセリフ）」）
3. 「意図を持つ目」を育てるアプリの一部であることを意識し、なぜそのデザインがこうなっているかを言語化する
4. 必ず JSON のみを返す。説明文や前置きを書かない

【JSON スキーマ】
{
  "concept": "string — このデザインの設計意図を1〜2文で",
  "typography": "string — 使われている文字の特徴（日常語＋専門用語）",
  "fontHints": ["string", ...] — 推定フォント候補（あれば）",
  "colors": [{ "hex": "#RRGGBB", "role": "string — その色が担っている役割" }],
  "composition": "string — 視線誘導や配置の意図",
  "target": "string — 想定されるターゲット層",
  "extractedText": ["string", ...] — 画像中の主要なテキスト",
  "category": "sign | logo | pop | signage | other"
}`;
  }

  return `You are an observer and commentator of design. Observe the provided image (a sign, logo, POP, signage, etc., from a street scene) and explain it with the designer's intent as the central focus.

[Output rules]
1. Use the tone of "observation and inference" throughout (avoid assertions; prefer "it appears to...", "the likely intent is...")
2. When using technical terms, always pair them with everyday language (e.g., "Bold sans-serif (thick fonts without serifs)")
3. This app exists to train "an eye that holds intent." Articulate WHY the design looks the way it does.
4. Return JSON ONLY. No prose, no preamble.

[JSON Schema]
{
  "concept": "string — the design's intent in 1-2 sentences",
  "typography": "string — character features (plain English + technical term)",
  "fontHints": ["string", ...] — estimated font candidates if any",
  "colors": [{ "hex": "#RRGGBB", "role": "string — what role this color plays" }],
  "composition": "string — visual flow and layout intent",
  "target": "string — likely target audience",
  "extractedText": ["string", ...] — main text visible in the image",
  "category": "sign | logo | pop | signage | other"
}`;
}

/**
 * 再現プロンプト生成用のシステムプロンプト。
 */
export function buildReproductionPromptSystem(language: 'ja' | 'en'): string {
  if (language === 'ja') {
    return `あなたは画像生成AI用のプロンプトを書く専門家です。送られた解析結果を読み、そのデザインを画像生成AI（DALL-E / Stable Diffusion等）で再現するためのプロンプトを作成してください。

【ルール】
- 解析結果の「設計意図」を保ったまま、別画像として再生成できるプロンプトにすること
- 著作権配慮のため、特定の固有名詞・商標・人物・既存ロゴは含めないこと
- 配色（HEX）・タイポ・構図・雰囲気を明示的に含める
- 出力はプロンプト本文のみ。前置きや解説は書かない`;
  }

  return `You write prompts for image-generation AI. Read the provided design analysis and craft a prompt that recreates the design's intent using image-generation AI (DALL-E / Stable Diffusion, etc.).

[Rules]
- Preserve the analyzed "design intent" while making it suitable for generating a new, distinct image
- For copyright safety, do NOT include specific proper nouns, brands, real persons, or existing logos
- Explicitly include color palette (HEX), typography, composition, and atmosphere
- Output only the prompt text. No preamble.`;
}
```

- [ ] **Step 8.3: テストを書く**

`tests/unit/lib/claude/client.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeImage, generateReproductionPrompt } from '@/lib/claude/client';

const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
      constructor(_opts: unknown) {}
    },
  };
});

describe('analyzeImage', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  it('should call Claude with the image and parse the JSON response', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            concept: 'セール訴求',
            typography: '極太サンセリフ（ヒゲのない太い文字）',
            fontHints: ['Impact'],
            colors: [{ hex: '#FF0000', role: 'primary' }],
            composition: '中央配置',
            target: '通行人',
            extractedText: ['SALE'],
            category: 'pop',
          }),
        },
      ],
    });

    const result = await analyzeImage({
      imageBase64: 'data:image/jpeg;base64,xxx',
      mediaType: 'image/jpeg',
      language: 'ja',
    });

    expect(result.concept).toBe('セール訴求');
    expect(result.colors[0].hex).toBe('#FF0000');
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('should throw when Claude returns malformed JSON', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'not json' }],
    });
    await expect(
      analyzeImage({ imageBase64: 'data:image/jpeg;base64,xxx', mediaType: 'image/jpeg', language: 'ja' }),
    ).rejects.toThrow();
  });
});

describe('generateReproductionPrompt', () => {
  it('should call Claude and return the prompt text', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '極太サンセリフで...' }],
    });

    const result = await generateReproductionPrompt({
      analysis: {
        concept: 'c',
        typography: 't',
        fontHints: [],
        colors: [],
        composition: 'x',
        target: 'x',
        extractedText: [],
        category: 'pop',
      },
      language: 'ja',
    });

    expect(result).toContain('極太サンセリフで');
  });
});
```

- [ ] **Step 8.4: テストが失敗することを確認**

```bash
pnpm test claude/client
```

Expected: `FAIL`

- [ ] **Step 8.5: クライアントを実装**

`src/lib/claude/client.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { buildAnalyzeSystemPrompt, buildReproductionPromptSystem } from './prompts';
import {
  AnalysisResultSchema,
  type AnalysisResult,
} from '@/types/analysis';

const MODEL = 'claude-sonnet-4-5';

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY が未設定です');
  return new Anthropic({ apiKey });
}

function extractText(response: Anthropic.Messages.Message): string {
  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude のレスポンスにテキストブロックがありません');
  }
  return textBlock.text;
}

/**
 * 撮影画像を Claude Vision で解析。
 * 仕様書 11.5「/api/analyze」のレスポンス形式と一致する JSON を返す。
 */
export async function analyzeImage(args: {
  imageBase64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  language: 'ja' | 'en';
}): Promise<AnalysisResult> {
  const client = getClient();
  const systemPrompt = buildAnalyzeSystemPrompt(args.language);

  // data URL のヘッダ部分（"data:image/jpeg;base64,"）を除去
  const base64 = args.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: args.mediaType,
              data: base64,
            },
          },
          {
            type: 'text',
            text: args.language === 'ja' ? 'このデザインを観察してください。' : 'Please observe this design.',
          },
        ],
      },
    ],
  });

  const text = extractText(response);
  const json = tryParseJson(text);
  return AnalysisResultSchema.parse({ ...json, rawResponse: text });
}

/**
 * 解析結果から再現プロンプトを生成。
 */
export async function generateReproductionPrompt(args: {
  analysis: Omit<AnalysisResult, 'rawResponse'>;
  language: 'ja' | 'en';
}): Promise<string> {
  const client = getClient();
  const systemPrompt = buildReproductionPromptSystem(args.language);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content:
          args.language === 'ja'
            ? `次の解析結果を読み、画像生成AI用の再現プロンプトを書いてください。\n\n${JSON.stringify(args.analysis, null, 2)}`
            : `Read the following analysis and write a reproduction prompt for image-generation AI.\n\n${JSON.stringify(args.analysis, null, 2)}`,
      },
    ],
  });

  return extractText(response).trim();
}

function tryParseJson(text: string): unknown {
  // Claude が念のため ```json ... ``` で囲んだ場合の対策
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/, '')
    .replace(/```$/, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Claude のレスポンスが JSON ではありません: ${cleaned.slice(0, 100)}...`);
  }
}
```

- [ ] **Step 8.6: テストがパスすることを確認**

```bash
pnpm test claude/client
```

Expected: `3 passed`

- [ ] **Step 8.7: コミット**

```bash
git add .
git commit -m "feat: Claude Vision クライアント（解析 + 再現プロンプト生成）"
```

---

## Task 9: API Route `/api/analyze`

**Files:**
- Create: `src/app/api/analyze/route.ts`
- Create: `tests/integration/api/analyze.test.ts`

- [ ] **Step 9.1: テストを書く**

`tests/integration/api/analyze.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/claude/client', () => ({
  analyzeImage: vi.fn(),
}));

import { POST } from '@/app/api/analyze/route';
import { analyzeImage } from '@/lib/claude/client';

const validAnalysis = {
  concept: 'c',
  typography: 't',
  fontHints: [],
  colors: [{ hex: '#FF0000', role: 'primary' }],
  composition: 'x',
  target: 'x',
  extractedText: [],
  category: 'pop',
  rawResponse: '{}',
};

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/analyze', () => {
  beforeEach(() => {
    vi.mocked(analyzeImage).mockReset();
  });

  it('should return 400 for invalid input', async () => {
    const res = await POST(makeRequest({ image: 'not-data-url', language: 'ja' }));
    expect(res.status).toBe(400);
  });

  it('should return 200 and analysis JSON for valid input', async () => {
    vi.mocked(analyzeImage).mockResolvedValue(validAnalysis);
    const res = await POST(
      makeRequest(
        { image: 'data:image/jpeg;base64,xxx', language: 'ja' },
        { 'x-forwarded-for': '1.2.3.4' },
      ),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.concept).toBe('c');
  });

  it('should return 500 when Claude fails', async () => {
    vi.mocked(analyzeImage).mockRejectedValue(new Error('boom'));
    const res = await POST(
      makeRequest(
        { image: 'data:image/jpeg;base64,xxx', language: 'ja' },
        { 'x-forwarded-for': '1.2.3.5' },
      ),
    );
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 9.2: テストが失敗することを確認**

```bash
pnpm test api/analyze
```

Expected: `FAIL`

- [ ] **Step 9.3: ルートを実装**

`src/app/api/analyze/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { AnalyzeRequestSchema } from '@/types/analysis';
import { analyzeImage } from '@/lib/claude/client';
import { analyzeRateLimiter } from '@/lib/rate-limit/memory-store';

export const runtime = 'nodejs';
export const maxDuration = 30;

function getClientKey(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return 'unknown';
}

function getMediaType(dataUrl: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  const match = dataUrl.match(/^data:(image\/(jpeg|png|webp));base64,/);
  if (!match) throw new Error('未対応の画像形式');
  return match[1] as 'image/jpeg' | 'image/png' | 'image/webp';
}

export async function POST(req: Request) {
  const clientKey = getClientKey(req);

  const rate = analyzeRateLimiter.check(clientKey);
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterMs: rate.retryAfterMs },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rate.retryAfterMs / 1000)) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = AnalyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const mediaType = getMediaType(parsed.data.image);
    const result = await analyzeImage({
      imageBase64: parsed.data.image,
      mediaType,
      language: parsed.data.language,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/analyze] error', err);
    return NextResponse.json({ error: 'analysis_failed' }, { status: 500 });
  }
}
```

- [ ] **Step 9.4: テストがパスすることを確認**

```bash
pnpm test api/analyze
```

Expected: `3 passed`

- [ ] **Step 9.5: コミット**

```bash
git add .
git commit -m "feat: POST /api/analyze（Zod検証 + レート制限 + Claude呼び出し）"
```

---

## Task 10: API Route `/api/prompt`

**Files:**
- Create: `src/app/api/prompt/route.ts`
- Create: `tests/integration/api/prompt.test.ts`

- [ ] **Step 10.1: テストを書く**

`tests/integration/api/prompt.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/claude/client', () => ({
  generateReproductionPrompt: vi.fn(),
}));

import { POST } from '@/app/api/prompt/route';
import { generateReproductionPrompt } from '@/lib/claude/client';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.6' },
    body: JSON.stringify(body),
  });
}

const validAnalysis = {
  concept: 'c',
  typography: 't',
  fontHints: [],
  colors: [{ hex: '#FF0000', role: 'primary' }],
  composition: 'x',
  target: 'x',
  extractedText: [],
  category: 'pop' as const,
};

describe('POST /api/prompt', () => {
  beforeEach(() => vi.mocked(generateReproductionPrompt).mockReset());

  it('should return 400 for invalid input', async () => {
    const res = await POST(makeRequest({ language: 'ja' }));
    expect(res.status).toBe(400);
  });

  it('should return 200 with prompt string', async () => {
    vi.mocked(generateReproductionPrompt).mockResolvedValue('生成されたプロンプト');
    const res = await POST(makeRequest({ analysis: validAnalysis, language: 'ja' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.prompt).toBe('生成されたプロンプト');
  });
});
```

- [ ] **Step 10.2: テストが失敗することを確認**

```bash
pnpm test api/prompt
```

Expected: `FAIL`

- [ ] **Step 10.3: 実装**

`src/app/api/prompt/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { PromptRequestSchema } from '@/types/analysis';
import { generateReproductionPrompt } from '@/lib/claude/client';
import { analyzeRateLimiter } from '@/lib/rate-limit/memory-store';

export const runtime = 'nodejs';
export const maxDuration = 20;

function getClientKey(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return 'unknown';
}

export async function POST(req: Request) {
  const rate = analyzeRateLimiter.check(getClientKey(req));
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterMs: rate.retryAfterMs },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = PromptRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  try {
    const prompt = await generateReproductionPrompt({
      analysis: parsed.data.analysis,
      language: parsed.data.language,
    });
    return NextResponse.json({ prompt });
  } catch (err) {
    console.error('[/api/prompt] error', err);
    return NextResponse.json({ error: 'prompt_failed' }, { status: 500 });
  }
}
```

- [ ] **Step 10.4: テスト通過確認**

```bash
pnpm test api/prompt
```

Expected: `2 passed`

- [ ] **Step 10.5: コミット**

```bash
git add .
git commit -m "feat: POST /api/prompt（再現プロンプト生成）"
```

---

## Task 11: i18n セットアップ（next-intl）

**Files:**
- Create: `src/lib/i18n/routing.ts`
- Create: `src/lib/i18n/config.ts`
- Create: `src/messages/ja.json`
- Create: `src/messages/en.json`
- Create: `src/middleware.ts`
- Modify: `next.config.ts`
- Modify: `src/app/layout.tsx`（削除予定）
- Move: `src/app/page.tsx` → `src/app/[locale]/page.tsx`

- [ ] **Step 11.1: next-intl をインストール**

```bash
pnpm add next-intl
```

- [ ] **Step 11.2: routing 設定**

`src/lib/i18n/routing.ts`:

```typescript
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['ja', 'en'],
  defaultLocale: 'ja',
  localePrefix: 'always',
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
```

- [ ] **Step 11.3: i18n リクエスト設定**

`src/lib/i18n/config.ts`:

```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = routing.locales.includes(requested as 'ja' | 'en')
    ? (requested as 'ja' | 'en')
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 11.4: 翻訳ファイル（日本語）**

`src/messages/ja.json`:

```json
{
  "common": {
    "appName": "Design Lens",
    "tagline": "街歩きが、デザイン学習に変わる。",
    "loading": "読み込み中…",
    "retry": "もう一度試す",
    "back": "戻る",
    "save": "保存する",
    "delete": "削除する",
    "ok": "OK",
    "cancel": "キャンセル"
  },
  "home": {
    "title": "デザインを観察しよう",
    "subtitle": "街中の看板やPOPを撮影すると、AIが意図を読み解きます。",
    "capture": "撮影する",
    "viewArchive": "図鑑を見る",
    "vision": "AI時代に「意図を持つ目」を育てる"
  },
  "camera": {
    "starting": "カメラを起動中…",
    "permissionDenied": "カメラの利用が許可されていません。ブラウザの設定からカメラを許可してください。",
    "shutter": "シャッター",
    "switchCamera": "カメラを切り替え",
    "cancel": "キャンセル"
  },
  "analyze": {
    "analyzing": "AIが観察中…",
    "noteAiInference": "※AIによる観察と推測です。正解ではありません。",
    "concept": "設計意図",
    "typography": "文字の特徴",
    "colors": "配色",
    "composition": "構図",
    "target": "想定ターゲット",
    "extractedText": "デザイン中のテキスト",
    "category": "カテゴリ",
    "categories": {
      "sign": "看板",
      "logo": "ロゴ",
      "pop": "POP",
      "signage": "サイネージ",
      "other": "その他"
    },
    "generatePrompt": "AIで再現するプロンプトを作る",
    "generatingPrompt": "プロンプトを生成中…",
    "promptHeading": "再現プロンプト",
    "copyPrompt": "プロンプトをコピー",
    "promptCopied": "コピーしました"
  },
  "archive": {
    "title": "観察した図鑑",
    "empty": "まだ何も観察していません。撮影から始めましょう。",
    "openItem": "詳細を見る"
  },
  "errors": {
    "analysisFailed": "AI解析に失敗しました。時間をおいて再度お試しください。",
    "rateLimited": "短時間に多くのリクエストがありました。少し待ってから試してください。",
    "saveFailed": "保存に失敗しました。",
    "loadFailed": "読み込みに失敗しました。"
  }
}
```

- [ ] **Step 11.5: 翻訳ファイル（英語）**

`src/messages/en.json`:

```json
{
  "common": {
    "appName": "Design Lens",
    "tagline": "Turn your walk into a design lesson.",
    "loading": "Loading…",
    "retry": "Try again",
    "back": "Back",
    "save": "Save",
    "delete": "Delete",
    "ok": "OK",
    "cancel": "Cancel"
  },
  "home": {
    "title": "Observe design in the wild",
    "subtitle": "Photograph street signs and POPs — AI will read the designer's intent.",
    "capture": "Capture",
    "viewArchive": "View archive",
    "vision": "Train your eye for design intent in the age of AI"
  },
  "camera": {
    "starting": "Starting camera…",
    "permissionDenied": "Camera access is not granted. Allow camera in your browser settings.",
    "shutter": "Shutter",
    "switchCamera": "Switch camera",
    "cancel": "Cancel"
  },
  "analyze": {
    "analyzing": "AI is observing…",
    "noteAiInference": "* This is AI's observation and inference, not a definitive answer.",
    "concept": "Design intent",
    "typography": "Typography",
    "colors": "Color palette",
    "composition": "Composition",
    "target": "Target audience",
    "extractedText": "Text in design",
    "category": "Category",
    "categories": {
      "sign": "Sign",
      "logo": "Logo",
      "pop": "POP",
      "signage": "Signage",
      "other": "Other"
    },
    "generatePrompt": "Make a prompt to recreate with AI",
    "generatingPrompt": "Generating prompt…",
    "promptHeading": "Reproduction prompt",
    "copyPrompt": "Copy prompt",
    "promptCopied": "Copied"
  },
  "archive": {
    "title": "Your design archive",
    "empty": "Nothing observed yet. Start with a capture.",
    "openItem": "Open"
  },
  "errors": {
    "analysisFailed": "Analysis failed. Please try again later.",
    "rateLimited": "Too many requests in a short time. Please wait a bit.",
    "saveFailed": "Failed to save.",
    "loadFailed": "Failed to load."
  }
}
```

- [ ] **Step 11.6: middleware を作成**

`src/middleware.ts`:

```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/lib/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

- [ ] **Step 11.7: `next.config.ts` を更新**

`next.config.ts` を以下に置き換え：

```typescript
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/config.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 11.8: 既存のページを `[locale]` 配下に移動**

```bash
mkdir -p src/app/\[locale\]
mv src/app/page.tsx "src/app/[locale]/page.tsx"
```

- [ ] **Step 11.9: `[locale]/layout.tsx` を作成**

`src/app/[locale]/layout.tsx`:

```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/lib/i18n/routing';
import type { ReactNode } from 'react';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as 'ja' | 'en')) notFound();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 11.10: 既存の `src/app/layout.tsx` を削除**

```bash
rm src/app/layout.tsx
```

- [ ] **Step 11.11: ホームページを翻訳対応に書き換え**

`src/app/[locale]/page.tsx`:

```typescript
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('home');
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="mt-2 text-gray-600">{t('subtitle')}</p>
    </main>
  );
}
```

- [ ] **Step 11.12: 開発サーバで動作確認**

```bash
pnpm dev
```

`http://localhost:3000/ja` と `http://localhost:3000/en` の両方にアクセスし、それぞれの言語のテキストが表示されることを確認。確認後 `Ctrl+C`。

- [ ] **Step 11.13: コミット**

```bash
git add .
git commit -m "feat: next-intl による日本語/英語 i18n セットアップ + ホーム画面"
```

---

## Task 12: shadcn/ui セットアップと基本コンポーネント

**Files:**
- Modify: `tsconfig.json`（path alias 確認）
- Create: `components.json`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/lib/utils.ts`

- [ ] **Step 12.1: 依存をインストール**

```bash
pnpm add clsx tailwind-merge class-variance-authority @radix-ui/react-slot lucide-react
```

- [ ] **Step 12.2: cn ヘルパーを作成**

`src/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 12.3: Button コンポーネントを作成**

`src/components/ui/button.tsx`:

```typescript
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-black text-white hover:bg-gray-800',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        ghost: 'hover:bg-gray-100',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';
```

- [ ] **Step 12.4: Card コンポーネントを作成**

`src/components/ui/card.tsx`:

```typescript
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-lg border bg-white shadow-sm', className)} {...props} />
  ),
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold leading-none', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';
```

- [ ] **Step 12.5: 動作確認用にホームページにボタンを追加**

`src/app/[locale]/page.tsx` を更新:

```typescript
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/routing';

export default function Home() {
  const t = useTranslations('home');
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-6">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="text-center text-gray-600 max-w-md">{t('subtitle')}</p>
      <p className="text-sm text-gray-500">{t('vision')}</p>
      <div className="flex gap-3">
        <Button size="lg" asChild>
          <Link href="/capture">{t('capture')}</Link>
        </Button>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/archive">{t('viewArchive')}</Link>
        </Button>
      </div>
    </main>
  );
}
```

- [ ] **Step 12.6: 動作確認**

```bash
pnpm dev
```

`http://localhost:3000/ja` で「撮影する」「図鑑を見る」のボタンが表示される。確認後 `Ctrl+C`。

- [ ] **Step 12.7: コミット**

```bash
git add .
git commit -m "feat: Button / Card 基本UIコンポーネント + ホーム画面更新"
```

---

## Task 13: カメラフック `useCamera`

**Files:**
- Create: `src/components/camera/useCamera.ts`
- Create: `tests/unit/components/camera/useCamera.test.tsx`

- [ ] **Step 13.1: テストを書く**

`tests/unit/components/camera/useCamera.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCamera } from '@/components/camera/useCamera';

describe('useCamera', () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGetUserMedia = vi.fn();
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
    });
  });

  it('should start with status idle', () => {
    const { result } = renderHook(() => useCamera());
    expect(result.current.status).toBe('idle');
  });

  it('should set status to ready when getUserMedia succeeds', async () => {
    const fakeStream = { getTracks: () => [] } as unknown as MediaStream;
    mockGetUserMedia.mockResolvedValue(fakeStream);
    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => expect(result.current.status).toBe('ready'));
  });

  it('should set status to denied when getUserMedia rejects', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('permission denied'));
    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => expect(result.current.status).toBe('denied'));
  });
});
```

- [ ] **Step 13.2: テストが失敗することを確認**

```bash
pnpm test useCamera
```

Expected: `FAIL`

- [ ] **Step 13.3: 実装**

`src/components/camera/useCamera.ts`:

```typescript
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraStatus = 'idle' | 'starting' | 'ready' | 'denied' | 'error';

export interface UseCameraResult {
  status: CameraStatus;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  start: () => Promise<void>;
  stop: () => void;
  capture: () => Promise<Blob | null>;
  error: string | null;
}

export function useCamera(opts: { facingMode?: 'user' | 'environment' } = {}): UseCameraResult {
  const facingMode = opts.facingMode ?? 'environment';
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setStatus('starting');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus('ready');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      if (/permission|denied|NotAllowed/i.test(msg)) setStatus('denied');
      else setStatus('error');
      setError(msg);
    }
  }, [facingMode]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
  }, []);

  const capture = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9);
    });
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { status, videoRef, start, stop, capture, error };
}
```

- [ ] **Step 13.4: テスト通過確認**

```bash
pnpm test useCamera
```

Expected: `3 passed`

- [ ] **Step 13.5: コミット**

```bash
git add .
git commit -m "feat: useCamera フック（カメラ起動・停止・撮影）"
```

---

## Task 14: カメラコンポーネント `CameraCapture`

**Files:**
- Create: `src/components/camera/CameraCapture.tsx`
- Create: `src/app/[locale]/capture/page.tsx`

- [ ] **Step 14.1: Zustand をインストール（一時アップロード状態の管理用）**

```bash
pnpm add zustand uuid
pnpm add -D @types/uuid
```

- [ ] **Step 14.2: CameraCapture を実装**

`src/components/camera/CameraCapture.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useCamera } from './useCamera';

interface Props {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: Props) {
  const t = useTranslations('camera');
  const { status, videoRef, start, stop, capture, error } = useCamera({ facingMode: 'environment' });

  useEffect(() => {
    start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShutter = async () => {
    const blob = await capture();
    if (blob) {
      stop();
      onCapture(blob);
    }
  };

  if (status === 'denied') {
    return (
      <div className="p-6 flex flex-col items-center gap-4">
        <p className="text-red-600 text-center">{t('permissionDenied')}</p>
        <Button variant="secondary" onClick={onCancel}>
          {t('cancel')}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <video
        ref={videoRef}
        className="flex-1 w-full object-cover"
        playsInline
        muted
        autoPlay
      />
      {status === 'starting' && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          {t('starting')}
        </div>
      )}
      {error && status === 'error' && (
        <div className="absolute top-4 left-4 right-4 bg-red-600 text-white p-3 rounded">
          {error}
        </div>
      )}
      <div className="p-6 flex items-center justify-around bg-black/60">
        <Button variant="ghost" className="text-white" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <button
          aria-label={t('shutter')}
          onClick={handleShutter}
          disabled={status !== 'ready'}
          className="w-16 h-16 rounded-full border-4 border-white bg-white disabled:opacity-50"
        />
        <div className="w-16" />
      </div>
    </div>
  );
}
```

- [ ] **Step 14.3: 撮影ページの実装（解析API呼び出し含む）**

`src/app/[locale]/capture/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/routing';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { compressImage, blobToDataUrl } from '@/lib/image/compress';
import { savePhotoWithAnalysis } from '@/lib/db/repository';
import { AnalysisResultSchema, type AnalysisResult } from '@/types/analysis';
import { useLocale } from 'next-intl';

export default function CapturePage() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale() as 'ja' | 'en';
  const [phase, setPhase] = useState<'capturing' | 'analyzing' | 'error'>('capturing');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleCapture(blob: Blob) {
    setPhase('analyzing');
    try {
      // 圧縮
      const compressed = await compressImage({ source: blob, maxLongSide: 1024, quality: 0.85 });
      const thumb = await compressImage({ source: blob, maxLongSide: 256, quality: 0.8 });
      const dataUrl = await blobToDataUrl(compressed);

      // API 呼び出し
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, language: locale }),
      });

      if (res.status === 429) {
        setErrorMsg(t('errors.rateLimited'));
        setPhase('error');
        return;
      }
      if (!res.ok) {
        setErrorMsg(t('errors.analysisFailed'));
        setPhase('error');
        return;
      }

      const json = (await res.json()) as AnalysisResult;
      const parsed = AnalysisResultSchema.safeParse(json);
      if (!parsed.success) {
        setErrorMsg(t('errors.analysisFailed'));
        setPhase('error');
        return;
      }

      // 保存
      const { analysisId } = await savePhotoWithAnalysis({
        blob: compressed,
        thumbnailBlob: thumb,
        analysis: parsed.data,
        language: locale,
      });

      router.push(`/analyze/${analysisId}`);
    } catch (e) {
      console.error(e);
      setErrorMsg(t('errors.analysisFailed'));
      setPhase('error');
    }
  }

  if (phase === 'analyzing') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-lg">{t('analyze.analyzing')}</p>
      </main>
    );
  }

  if (phase === 'error') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-600 text-center">{errorMsg}</p>
        <button
          className="rounded-md bg-black text-white px-4 py-2"
          onClick={() => setPhase('capturing')}
        >
          {t('common.retry')}
        </button>
      </main>
    );
  }

  return <CameraCapture onCapture={handleCapture} onCancel={() => router.push('/')} />;
}
```

- [ ] **Step 14.4: 動作確認**

```bash
pnpm dev
```

`http://localhost:3000/ja/capture` にアクセスし、カメラ許可ダイアログが出ることを確認。
（ローカルテストでは Claude API が必要なので、Task 17 で .env を設定後に通しテストする）
確認後 `Ctrl+C`。

- [ ] **Step 14.5: コミット**

```bash
git add .
git commit -m "feat: CameraCapture コンポーネント + /capture ページ（解析API連携）"
```

---

## Task 15: 解析結果画面 `AnalysisCard` + `/analyze/[id]`

**Files:**
- Create: `src/components/analysis/ColorPalette.tsx`
- Create: `src/components/analysis/AnalysisCard.tsx`
- Create: `src/app/[locale]/analyze/[id]/page.tsx`

- [ ] **Step 15.1: ColorPalette を実装**

`src/components/analysis/ColorPalette.tsx`:

```typescript
import type { Color } from '@/types/analysis';

interface Props {
  colors: Color[];
}

export function ColorPalette({ colors }: Props) {
  if (colors.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((c, i) => (
        <div key={i} className="flex flex-col items-center text-xs">
          <div
            className="h-12 w-12 rounded border"
            style={{ backgroundColor: c.hex }}
            aria-label={`${c.hex} - ${c.role}`}
          />
          <span className="mt-1 font-mono">{c.hex}</span>
          <span className="text-gray-600">{c.role}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 15.2: AnalysisCard を実装（意図ファースト視覚順序）**

`src/components/analysis/AnalysisCard.tsx`:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorPalette } from './ColorPalette';
import type { AnalysisResult } from '@/types/analysis';

interface Props {
  analysis: Omit<AnalysisResult, 'rawResponse'> & { rawResponse?: string };
}

export function AnalysisCard({ analysis }: Props) {
  const t = useTranslations('analyze');

  return (
    <div className="space-y-4">
      {/* 意図ファースト: まず設計意図 */}
      <Card className="border-2 border-black">
        <CardHeader>
          <CardTitle>{t('concept')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed">{analysis.concept}</p>
        </CardContent>
      </Card>

      {/* 続いて要素 */}
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
            <p className="mt-2 text-sm text-gray-600">
              {analysis.fontHints.join(' / ')}
            </p>
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
            <ul className="list-disc list-inside text-sm">
              {analysis.extractedText.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-gray-500 mt-4">{t('noteAiInference')}</p>
    </div>
  );
}
```

- [ ] **Step 15.3: 解析結果ページを実装**

`src/app/[locale]/analyze/[id]/page.tsx`:

```typescript
'use client';

import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import { getAnalysisWithPhoto, savePrompt, getPromptByAnalysisId } from '@/lib/db/repository';
import type { AnalysisRecord, PhotoRecord } from '@/lib/db/schema';
import { AnalysisCard } from '@/components/analysis/AnalysisCard';
import { Button } from '@/components/ui/button';

export default function AnalyzeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  const locale = useLocale() as 'ja' | 'en';
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [photo, setPhoto] = useState<PhotoRecord | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let urlForCleanup: string | null = null;
    (async () => {
      const result = await getAnalysisWithPhoto(id);
      if (!result) return;
      setAnalysis(result.analysis);
      setPhoto(result.photo ?? null);
      if (result.photo) {
        urlForCleanup = URL.createObjectURL(result.photo.blob);
        setPhotoUrl(urlForCleanup);
      }
      const existing = await getPromptByAnalysisId(id);
      if (existing) setPrompt(existing.prompt);
    })();
    return () => {
      if (urlForCleanup) URL.revokeObjectURL(urlForCleanup);
    };
  }, [id]);

  async function handleGeneratePrompt() {
    if (!analysis) return;
    setPromptLoading(true);
    try {
      const res = await fetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: {
            concept: analysis.concept,
            typography: analysis.typography,
            fontHints: analysis.fontHints,
            colors: analysis.colors,
            composition: analysis.composition,
            target: analysis.target,
            extractedText: analysis.extractedText,
            category: analysis.category,
          },
          language: locale,
        }),
      });
      if (!res.ok) {
        throw new Error('prompt failed');
      }
      const json = (await res.json()) as { prompt: string };
      setPrompt(json.prompt);
      await savePrompt({ analysisId: id, prompt: json.prompt });
    } catch {
      // エラー UI は最小：ボタンを再表示するのみ
    } finally {
      setPromptLoading(false);
    }
  }

  async function handleCopyPrompt() {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!analysis) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="mb-4">
        <Link href="/" className="text-sm text-gray-600">
          ← {t('common.back')}
        </Link>
      </div>

      {photoUrl && (
        <img src={photoUrl} alt="captured" className="w-full rounded-lg mb-6" />
      )}

      <AnalysisCard analysis={analysis} />

      <div className="mt-8">
        {!prompt && (
          <Button onClick={handleGeneratePrompt} disabled={promptLoading} size="lg">
            {promptLoading ? t('analyze.generatingPrompt') : t('analyze.generatePrompt')}
          </Button>
        )}
        {prompt && (
          <div className="rounded-lg border bg-gray-50 p-4">
            <h3 className="font-semibold mb-2">{t('analyze.promptHeading')}</h3>
            <p className="text-sm whitespace-pre-wrap mb-3">{prompt}</p>
            <Button size="sm" variant="secondary" onClick={handleCopyPrompt}>
              {copied ? t('analyze.promptCopied') : t('analyze.copyPrompt')}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 15.4: コミット**

```bash
git add .
git commit -m "feat: 解析結果画面（意図ファースト表示 + 再現プロンプト生成）"
```

---

## Task 16: アーカイブ画面 `/archive`

**Files:**
- Create: `src/components/archive/PhotoGrid.tsx`
- Create: `src/app/[locale]/archive/page.tsx`

- [ ] **Step 16.1: PhotoGrid を実装**

`src/components/archive/PhotoGrid.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import { listRecentAnalyses } from '@/lib/db/repository';
import { db } from '@/lib/db/schema';
import type { AnalysisRecord } from '@/lib/db/schema';

interface Item {
  analysis: AnalysisRecord;
  thumbUrl: string | null;
}

export function PhotoGrid() {
  const t = useTranslations('archive');
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const urls: string[] = [];
    (async () => {
      const analyses = await listRecentAnalyses({ limit: 50 });
      const enriched = await Promise.all(
        analyses.map(async (a) => {
          const photo = await db.photos.get(a.photoId);
          const url = photo ? URL.createObjectURL(photo.thumbnailBlob) : null;
          if (url) urls.push(url);
          return { analysis: a, thumbUrl: url };
        }),
      );
      setItems(enriched);
      setLoaded(true);
    })();
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  if (!loaded) {
    return <p className="text-center text-gray-500 mt-12">…</p>;
  }

  if (items.length === 0) {
    return <p className="text-center text-gray-500 mt-12">{t('empty')}</p>;
  }

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map(({ analysis, thumbUrl }) => (
        <li key={analysis.id} className="rounded-md overflow-hidden border">
          <Link href={`/analyze/${analysis.id}`} className="block">
            {thumbUrl && (
              <img src={thumbUrl} alt="" className="w-full aspect-square object-cover" />
            )}
            <div className="p-2">
              <p className="text-xs line-clamp-2">{analysis.concept}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 16.2: アーカイブページを実装**

`src/app/[locale]/archive/page.tsx`:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import { PhotoGrid } from '@/components/archive/PhotoGrid';

export default function ArchivePage() {
  const t = useTranslations();
  return (
    <main className="min-h-screen p-4 max-w-3xl mx-auto">
      <div className="mb-4">
        <Link href="/" className="text-sm text-gray-600">
          ← {t('common.back')}
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">{t('archive.title')}</h1>
      <PhotoGrid />
    </main>
  );
}
```

- [ ] **Step 16.3: コミット**

```bash
git add .
git commit -m "feat: アーカイブ画面（IndexedDBから一覧表示）"
```

---

## Task 17: 環境変数設定と通し動作確認

**Files:**
- Create: `.env.example`
- Create: `.env.local`（git管理外）

- [ ] **Step 17.1: `.env.example` を作成**

`.env.example`:

```env
# Anthropic API
ANTHROPIC_API_KEY=sk-ant-xxxx

# レート制限はメモリベース（環境変数不要）
```

- [ ] **Step 17.2: `.env.local` を作成（実際のキーを設定）**

ユーザーは自身の Anthropic API キーを取得して `.env.local` に設定：

```env
ANTHROPIC_API_KEY=sk-ant-実際のキー
```

- [ ] **Step 17.3: 開発サーバで通し動作確認**

```bash
pnpm dev
```

ブラウザで以下を確認：
1. `http://localhost:3000/ja` でホーム画面表示
2. 「撮影する」をタップ → カメラ許可後、カメラ画面
3. シャッターをタップ → 「AIが観察中…」表示
4. 完了後、解析結果画面に遷移、設計意図が冒頭に大きく表示
5. 「AIで再現するプロンプトを作る」をタップ → プロンプトが生成・表示
6. 「図鑑を見る」→ 直前に撮影した画像のサムネイルが一覧に出る

確認後 `Ctrl+C`。

- [ ] **Step 17.4: コミット**

```bash
git add .env.example
git commit -m "feat: .env.example を追加（ANTHROPIC_API_KEY）"
```

---

## Task 18: PWA セットアップ

**Files:**
- Create: `src/app/manifest.ts`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Modify: `next.config.ts`

- [ ] **Step 18.1: next-pwa をインストール**

```bash
pnpm add next-pwa
pnpm add -D @types/next-pwa
```

- [ ] **Step 18.2: アイコン素材を準備**

`public/icons/` に以下のサイズの PNG アイコンを配置：
- `icon-192.png`（192x192）
- `icon-512.png`（512x512）

暫定で同色の単色 PNG を生成：

```bash
mkdir -p public/icons
# macOS の場合: ImageMagick (brew install imagemagick) があれば
which magick && magick -size 192x192 xc:'#000000' -fill white -gravity center -pointsize 80 -annotate 0 'DL' public/icons/icon-192.png || echo "Install ImageMagick or place icons manually"
which magick && magick -size 512x512 xc:'#000000' -fill white -gravity center -pointsize 200 -annotate 0 'DL' public/icons/icon-512.png || echo "Install ImageMagick or place icons manually"
ls public/icons/
```

ImageMagickがなければ、任意の方法で 192x192 と 512x512 の PNG を配置。

- [ ] **Step 18.3: manifest を作成**

`src/app/manifest.ts`:

```typescript
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Design Lens',
    short_name: 'DesignLens',
    description: '街中のデザインを観察し、意図を読み解くアプリ',
    start_url: '/ja',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
```

- [ ] **Step 18.4: next-pwa を有効化**

`next.config.ts` を更新：

```typescript
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from 'next-pwa';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/config.ts');

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

// next-pwa は any 型を返すため、ここで型を絞り直す
export default withPWA(withNextIntl(nextConfig) as never) as NextConfig;
```

- [ ] **Step 18.5: ビルドと PWA 動作確認**

```bash
pnpm build && pnpm start
```

別ターミナルで `http://localhost:3000/ja` を開き、Chrome DevTools → Application → Manifest を確認。`Design Lens` が manifest として認識されている。確認後 `Ctrl+C`。

- [ ] **Step 18.6: `.gitignore` を更新**

```bash
echo "
# next-pwa
public/sw.js
public/sw.js.map
public/workbox-*.js
public/workbox-*.js.map
" >> .gitignore
```

- [ ] **Step 18.7: コミット**

```bash
git add .
git commit -m "feat: PWA セットアップ（next-pwa + manifest + icons）"
```

---

## Task 19: Language Switcher

**Files:**
- Create: `src/components/common/LanguageSwitcher.tsx`
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 19.1: 実装**

`src/components/common/LanguageSwitcher.tsx`:

```typescript
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/lib/i18n/routing';
import { routing } from '@/lib/i18n/routing';

export function LanguageSwitcher() {
  const current = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex gap-2 text-xs">
      {routing.locales.map((l) => (
        <button
          key={l}
          onClick={() => router.replace(pathname, { locale: l })}
          className={l === current ? 'font-bold underline' : 'text-gray-500'}
          aria-current={l === current ? 'true' : undefined}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 19.2: layout に組み込む**

`src/app/[locale]/layout.tsx` を更新：

```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/lib/i18n/routing';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import type { ReactNode } from 'react';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as 'ja' | 'en')) notFound();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <header className="flex justify-end items-center p-3 border-b">
            <LanguageSwitcher />
          </header>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 19.3: 動作確認**

```bash
pnpm dev
```

`http://localhost:3000/ja` で右上に `JA / EN` が表示され、`EN` をタップで `/en` に遷移して英語に切り替わる。`Ctrl+C` で停止。

- [ ] **Step 19.4: コミット**

```bash
git add .
git commit -m "feat: 言語切替コンポーネント（ja ↔ en）"
```

---

## Task 20: E2E テスト（Playwright）

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/capture-flow.spec.ts`
- Modify: `package.json`（scripts追加）

- [ ] **Step 20.1: Playwright をインストール**

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

- [ ] **Step 20.2: 設定ファイル**

`playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    permissions: ['camera'],
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000/ja',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 20.3: スクリプト追加**

`package.json` の `"scripts"` に追加：

```json
{
  "scripts": {
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 20.4: テストを書く**

`tests/e2e/capture-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Design Lens basic flow', () => {
  test('home page renders and has primary navigation', async ({ page }) => {
    await page.goto('/ja');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: '撮影する' })).toBeVisible();
    await expect(page.getByRole('link', { name: '図鑑を見る' })).toBeVisible();
  });

  test('language switch toggles between ja and en', async ({ page }) => {
    await page.goto('/ja');
    await expect(page.getByRole('link', { name: '撮影する' })).toBeVisible();
    await page.getByRole('button', { name: 'EN' }).click();
    await expect(page).toHaveURL(/\/en/);
    await expect(page.getByRole('link', { name: 'Capture' })).toBeVisible();
  });

  test('archive page shows empty state initially', async ({ page }) => {
    await page.goto('/ja/archive');
    await expect(page.getByText('まだ何も観察していません')).toBeVisible();
  });
});
```

- [ ] **Step 20.5: 実行**

```bash
pnpm test:e2e
```

Expected: `3 passed`

- [ ] **Step 20.6: コミット**

```bash
git add .
git commit -m "test: Playwright E2E（ホーム表示・言語切替・空アーカイブ）"
```

---

## Task 21: README とデプロイ準備

**Files:**
- Create: `README.md`
- Create: `vercel.json`（任意）

- [ ] **Step 21.1: README を作成**

`README.md`:

```markdown
# Design Lens

街中のデザインを観察し、AI と一緒に「意図」を読み解く Web アプリ（PWA）。

## ビジョン

AI が誰でもデザインを作れる時代。これからは **「意図を持って AI を使いこなせる人」** が強い。
Design Lens は、街中の優れたデザインの意図を毎日言語化することで、その目を育てる学習アプリです。

## クイックスタート

### 必要なもの

- Node.js 20+
- pnpm 9+
- Anthropic API キー（https://console.anthropic.com）

### セットアップ

\`\`\`bash
pnpm install
cp .env.example .env.local
# .env.local を編集し、ANTHROPIC_API_KEY を設定
pnpm dev
\`\`\`

http://localhost:3000/ja を開く。

### テスト

\`\`\`bash
pnpm test          # 単体・統合（Vitest）
pnpm test:e2e      # E2E（Playwright）
\`\`\`

### デプロイ（Vercel）

1. このリポジトリを GitHub にプッシュ
2. Vercel に import
3. Environment Variables に `ANTHROPIC_API_KEY` を設定
4. Deploy

## ドキュメント

- 仕様書: \`docs/specs/2026-05-25-design-lens-spec.md\`
- 実装計画: \`docs/plans/2026-05-25-design-lens-phase1-mvp.md\`

## ライセンス

未定（Phase 1 終了時に決定）。
```

- [ ] **Step 21.2: コミット**

```bash
git add README.md
git commit -m "docs: README（セットアップ手順・テスト・デプロイ）"
```

---

## 最終確認

すべてのタスクを完了したら、以下を順に実行：

- [ ] **F.1: 単体・統合テストを通す**

```bash
pnpm test
```

Expected: すべての test が pass。

- [ ] **F.2: 型チェックを通す**

```bash
pnpm exec tsc --noEmit
```

Expected: エラーなし。

- [ ] **F.3: Lint を通す**

```bash
pnpm lint
```

Expected: エラーなし。

- [ ] **F.4: ビルドを通す**

```bash
pnpm build
```

Expected: ビルド成功。

- [ ] **F.5: E2E を通す**

```bash
pnpm test:e2e
```

Expected: すべて pass。

- [ ] **F.6: 通し動作確認**

`.env.local` に有効な `ANTHROPIC_API_KEY` を設定し、`pnpm dev` で実機（または PC のブラウザ）から：
1. 撮影 → 解析結果が表示される
2. 再現プロンプト生成が動く
3. 図鑑にサムネイルが表示される
4. 言語切替で UI が ja ↔ en と切り替わる

- [ ] **F.7: 最終コミット**

```bash
git status
git log --oneline | head -25
```

Expected: 全タスクのコミットが順に並んでいる。

---

## 補足: 仕様書とのマッピング

| 仕様書セクション | 対応タスク |
|------------------|-----------|
| 0. ビジョン / プロダクトの根本目的 | Task 11 (messages の `vision` / `noteAiInference`)、Task 8 (プロンプト設計) |
| 1. プロダクト概要 | Task 1（プロジェクト初期化）、全タスク |
| 3. コア機能（撮影・解析・保存・再現プロンプト）| Task 13, 14, 15 |
| 11.1 採用構成（オールインワン Next.js）| Task 1 |
| 11.2 技術スタック詳細 | Task 1, 2, 11, 12, 18 |
| 11.3 データフロー | Task 14（capture page） |
| 11.4 データモデル（IndexedDB）| Task 4, 5 |
| 11.5 API 設計（/api/analyze, /api/prompt）| Task 9, 10 |
| 11.6 エラー処理方針 | Task 9, 10, 14 |
| 11.7 UI/UX 原則（両方併記・意図ファースト・AIの推測明示）| Task 8（プロンプトに反映）、Task 15（意図ファースト表示）、Task 11（messages） |
| 11.8 セキュリティ（APIキーはサーバ側のみ・レート制限）| Task 7, 9, 17 |
| 11.9 テスト方針 | 全タスクのテストステップ、Task 20 (E2E) |
| 11.10 ディレクトリ構成 | 全タスクで段階的に構築 |
| 言語対応（日本語+英語UI）| Task 11, 19 |
| OCR 抽出 | Task 8（プロンプトに `extractedText` 含む）、Task 3, 4, 5（schema） |
