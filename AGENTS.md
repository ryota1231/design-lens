# AGENTS.md — Design Lens

> このファイルは Codex / Claude Code 等の AI エージェントへの指示書です。
> 作業を開始する前に必ず全文を読み、参照仕様書・実装計画書も併読してください。

---

## 1. プロジェクト概要

**プロダクト名**: Design Lens — 街中デザイン分析アプリ
**コンセプト**: 街歩きが、デザイン学習に変わる。

街中で見かけた看板・ロゴ・POP・サイネージなどのデザインをスマートフォンで撮影すると、AI（Claude Vision）がデザインの意図と要素を即座に言語化し、再現プロンプトまで生成する PWA（Progressive Web App）。

### 根本目的（必ず意識すること）

> **AI 時代に「意図を持つ目」を育てる学習アプリ**

AI が誰でもデザインを作れる時代に、強いのは「意図を持って AI を使いこなせる人」。このアプリは街中の優れたデザインの意図を毎日言語化することで、その目を育てる。

### リリース戦略

- **Phase 1（今回の実装範囲）**: PWA としてリリース
- **Phase 2（将来）**: Capacitor で iOS/Android にラップしてネイティブアプリ化

---

## 2. 必ず参照する 2 つのドキュメント

実装を始める前に、以下を必ず読んでください。

1. **仕様書（v0.7）**: `docs/specs/2026-05-25-design-lens-spec.md`
   - プロジェクトの全要件・データモデル・API設計・UI/UX原則がここに集約されている

2. **実装計画書**: `docs/plans/2026-05-25-design-lens-phase1-mvp.md`
   - 21 タスク + 最終確認で構成された bite-sized な実装手順
   - 各タスクに「テストコード→失敗確認→実装→通過確認→コミット」の TDD ステップが具体的に書かれている
   - **このプランの通りに順番に実装してください**

---

## 3. 技術スタック（変更しないこと）

| レイヤ | 採用技術 |
|--------|----------|
| フレームワーク | Next.js 15+（App Router）+ TypeScript |
| UI | React 19 + Tailwind CSS + shadcn/ui + lucide-react |
| PWA | next-pwa |
| 国際化 | next-intl（日本語 / 英語） |
| ローカルDB | IndexedDB（Dexie.js） |
| AI | Anthropic SDK（Claude Sonnet 4.5 Vision） |
| バリデーション | Zod |
| 状態管理 | Zustand |
| テスト | Vitest + Testing Library + msw（単体・統合）/ Playwright（E2E） |
| デプロイ | Vercel（無料枠） |
| パッケージマネージャ | **pnpm**（npm/yarn ではなく pnpm を使用） |

---

## 4. Phase 1 MVP スコープ（厳守）

### 実装すること
1. **撮影** — Web カメラ API で写真を取得
2. **AI 解析** — Claude Vision で「設計意図・配色・タイポ・構図・ターゲット・OCRテキスト・カテゴリ」を抽出
3. **ローカル保存** — 撮影画像と解析結果を IndexedDB に保存
4. **再現プロンプト生成** — 解析結果から画像生成AI用プロンプトを生成

### 実装しないこと（Phase 2 へ送る）
- ❌ 類似デザイン検索（コンセプト類似検索）
- ❌ 図鑑機能（カテゴリ自動分類のタグ・検索UI）
- ❌ ユーザー認証 / ログイン
- ❌ 端末間同期 / クラウドバックアップ
- ❌ 課金 / サブスクリプション
- ❌ アナリティクス（必要なら最後に検討）

スコープ外の機能を勝手に追加しないでください。

---

## 5. 絶対に守るべき実装規約

### 5.1 UI/UX 原則（仕様書 11.7 より）

#### 両方併記の原則
専門用語を使うときは**必ず日常語と併記**する。

- ❌ NG: `極太サンセリフ`
- ✅ OK: `ヒゲのない太い文字（極太サンセリフ）`
- ✅ OK: `画面の真ん中に大きく置く構図（センター強調レイアウト）`
- ✅ OK: `警告を連想させる色の組み合わせ（赤＋黄のコントラスト配色）`

英語UIでも同様。`Bold sans-serif (thick fonts without serifs)` のように両方記す。

これは **Claude Vision に投げるシステムプロンプトの中にも記述する**（Task 8 で実装）。

#### 意図ファースト
解析結果の**表示順序**で「設計意図（concept）」が最初に大きく出るようにする。
データ構造はフラットのままで構わないが、画面上は意図を上位に置く（Task 15 の `AnalysisCard` で実装）。

#### 「観察と推測」のトーン
AI の出力を「正解」として提示しない。「観察と推測」として明示する。
解析結果画面に必ず `※AIによる観察と推測です。正解ではありません。` の注記を入れる。

### 5.2 セキュリティ
- **`ANTHROPIC_API_KEY` を絶対にクライアント側に露出させない。** サーバ環境変数（`.env.local` / Vercel Env）のみで使用すること。
- 画像はサーバに永続化しない。API Routes は Claude に転送するだけで保存しない。
- レート制限（in-memory）で API コストを保護する。

### 5.3 コード品質
- **TDD で進める**: テスト→失敗確認→実装→通過確認→コミット
- 各ファイルは**単一責任**。1 ファイル 200-300 行を超えそうなら分割を検討
- TypeScript の `any` は使わない。Zod / 明示的な型で守る
- コメントは「なぜ」を書く。「何」はコードを読めば分かる
- コミットメッセージは日本語で OK（既存コミットに合わせる）。Prefix は `feat: / fix: / docs: / test: / refactor: / chore:` を使う

---

## 6. ファイル構成（実装計画書通り）

実装完了後の最終形：

```
design-lens/
├── docs/
│   ├── specs/2026-05-25-design-lens-spec.md       (既存・編集禁止)
│   └── plans/2026-05-25-design-lens-phase1-mvp.md (既存・編集禁止)
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                    # ホーム
│   │   │   ├── capture/page.tsx            # カメラ撮影
│   │   │   ├── analyze/[id]/page.tsx       # 解析結果
│   │   │   └── archive/page.tsx            # ローカル保存一覧
│   │   ├── api/
│   │   │   ├── analyze/route.ts            # POST /api/analyze
│   │   │   └── prompt/route.ts             # POST /api/prompt
│   │   ├── manifest.ts
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                             # shadcn/ui
│   │   ├── camera/                         # CameraCapture, useCamera
│   │   ├── analysis/                       # AnalysisCard, ColorPalette
│   │   ├── archive/                        # PhotoGrid
│   │   └── common/                         # LanguageSwitcher
│   ├── lib/
│   │   ├── claude/                         # Anthropic SDK ラッパ + プロンプト
│   │   ├── db/                             # Dexie schema + repository
│   │   ├── image/                          # 画像圧縮
│   │   ├── rate-limit/                     # In-memory rate limiter
│   │   └── i18n/                           # next-intl 設定
│   ├── messages/{ja,en}.json
│   ├── types/analysis.ts                   # Zod スキーマ
│   └── middleware.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/icons/
├── .env.example
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

---

## 7. 作業の進め方

### 7.1 一般原則
- **実装計画書（`docs/plans/2026-05-25-design-lens-phase1-mvp.md`）のタスクを Task 1 から順番に**実装する
- 各タスクは細かいステップ（Step N.M）に分かれている。**そのステップ順で実行**する
- 1 タスク完了ごとに `git commit` する（タスクの最終ステップに記載されている）
- タスクを跨いで実装をまとめない（コミット粒度を保つ）

### 7.2 ブランチ
- 作業ブランチ: `feature/phase1-mvp`（既に作成済み）
- main へのマージは全タスク完了後にユーザーが判断する

### 7.3 必要な環境変数
`.env.local` を作って以下を設定（`.env.example` を Task 17 で作るのでそれをコピーする）：

```env
ANTHROPIC_API_KEY=sk-ant-実際のキー
```

API キーは Anthropic Console（https://console.anthropic.com）で取得可能。
**`.env.local` は git にコミットしない**（`.gitignore` に登録済み）。

### 7.4 開発サーバ起動
```bash
pnpm dev
# → http://localhost:3000/ja を開く
```

### 7.5 検証コマンド
```bash
pnpm test          # 単体・統合（Vitest）
pnpm test:e2e      # E2E（Playwright）
pnpm exec tsc --noEmit   # 型チェック
pnpm lint          # ESLint
pnpm build         # 本番ビルド
```

タスク完了報告の前に、最低限 `pnpm test` と `pnpm exec tsc --noEmit` がパスすることを確認すること。

---

## 8. 既に確定している API スキーマ

詳細は仕様書 11.4-11.5 を参照。簡易版を以下に再掲。

### POST /api/analyze

リクエスト:
```json
{ "image": "data:image/jpeg;base64,...", "language": "ja" }
```

レスポンス:
```json
{
  "concept": "string",
  "typography": "string",
  "fontHints": ["string"],
  "colors": [{ "hex": "#RRGGBB", "role": "string" }],
  "composition": "string",
  "target": "string",
  "extractedText": ["string"],
  "category": "sign | logo | pop | signage | other",
  "rawResponse": "string"
}
```

エラー: `400`（入力不正）/ `429`（レート制限）/ `500`（解析失敗）

### POST /api/prompt

リクエスト:
```json
{ "analysis": { ... }, "language": "ja" }
```

レスポンス:
```json
{ "prompt": "再現プロンプト本文" }
```

---

## 9. 困ったときの判断基準

| 状況 | どうするか |
|------|-----------|
| プランに書かれていないことを思いついた | **やらない**。スコープ外。実装後にユーザーに提案。 |
| プランの記述が曖昧 | プランの方針に最も近い解釈で実装し、コミットメッセージか PR で明記 |
| プランと仕様書が矛盾 | **仕様書を優先**。プランの誤りは修正してコミット。 |
| ライブラリのバージョンで動かない | バージョンを固定して動く形を作る。後でアップデート可能 |
| 大量のテストが失敗 | 1 つずつ原因を特定。まとめて修正しようとしない |

---

## 10. してはいけないこと

- ❌ 仕様書（`docs/specs/`）や計画書（`docs/plans/`）の**勝手な編集**
- ❌ 技術スタックの**勝手な変更**（例: Next.js → Remix）
- ❌ スコープ外機能の**勝手な追加**（類似検索、ログイン、課金等）
- ❌ `ANTHROPIC_API_KEY` の**クライアント側への露出**
- ❌ `.env.local` の**コミット**
- ❌ `main` ブランチへの**直接コミット**（必ず `feature/phase1-mvp` で作業）
- ❌ テストを**書かない実装**（TDDの原則を守る）
- ❌ `--force` / `--no-verify` 等の**強制系オプション**の使用

---

## 11. 言語

- **やり取り**: 日本語
- **コメント・コミットメッセージ**: 日本語 OK
- **コード（変数名・関数名）**: 英語
- **UI 文言**: 日本語 + 英語（next-intl で `messages/{ja,en}.json` に集約）
- **解析結果**: ユーザー選択言語（ja or en）で Claude が生成

---

## 12. 完了後にやること

全 21 タスクが完了したら：

1. `pnpm test && pnpm test:e2e && pnpm exec tsc --noEmit && pnpm build` がすべて通ることを確認
2. `.env.local` に有効な API キーを設定して、実機で通し動作確認
3. ユーザーに「全タスク完了、レビューお願いします」と報告
4. レビュー後、ユーザーが `main` へのマージや Vercel デプロイを判断

---

## 13. 参考: 既存のコミット履歴

`main` ブランチに以下のコミットが既にある（仕様書と計画書のみ。実装コードはまだない）：

```
9c8fe2d docs: Phase 1 MVP の実装計画書を作成
a7bef6c docs: ビジョン（セクション0）とUI/UX原則を仕様書に追加 (v0.7)
1c12f90 docs: Design Lens 仕様書 v0.6 の初版コミット
```

`feature/phase1-mvp` ブランチに以下：

```
63b6eed chore: .gitignore に .claude/ を追加（個人進捗メモを除外）
```

---

質問があればいつでもユーザーに確認してください。**推測で進めるよりも、確認する方がよい仕事になります。**
