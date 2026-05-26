# Design Lens

街歩きが、デザイン学習に変わる。

Design Lens は、街中の看板・ロゴ・POP・サイネージなどを撮影し、Claude Vision でデザインの意図・配色・文字・構図・想定ターゲットを言語化する Phase 1 MVP の PWA です。

## セットアップ

```bash
pnpm install
cp .env.example .env.local
```

`.env.local` にはユーザー自身で Anthropic API キーを設定してください。キー本体は Codex やチャットに貼り付けないでください。

```env
ANTHROPIC_API_KEY=sk-ant-xxxx
```

Playwright の E2E を初回実行する前に Chromium を入れます。

```bash
pnpm exec playwright install chromium
```

`pnpm` が未導入の環境では、`corepack pnpm ...` でも実行できます。

## 開発

```bash
pnpm dev
```

起動後、以下を開きます。

- 日本語: http://localhost:3000/ja
- English: http://localhost:3000/en

## 検証

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

`pnpm test` は Vitest の単体・統合テスト、`pnpm test:e2e` は Playwright のブラウザ E2E です。

## 環境変数

| 変数名 | 用途 |
| --- | --- |
| `ANTHROPIC_API_KEY` | `/api/analyze` と `/api/prompt` で Claude API を呼び出すために使用 |

`ANTHROPIC_API_KEY` はサーバー側のみで使用し、クライアントには露出させません。

## デプロイ

Vercel にデプロイする場合は、Project Settings の Environment Variables に `ANTHROPIC_API_KEY` を設定してください。

ビルドコマンドは通常どおりです。

```bash
pnpm build
```

## Phase 1 の範囲

この MVP では、撮影、Claude Vision 解析、IndexedDB へのローカル保存、再現プロンプト生成、PWA、日英 UI、基本 E2E までを扱います。

類似検索、ログイン、課金、端末間同期、クラウドバックアップ、アナリティクスは Phase 1 では実装しません。
