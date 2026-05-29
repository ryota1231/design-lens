# 解析項目の拡張（フルジャーニー化）設計書

- **作成日**: 2026-05-29
- **対象プロジェクト**: Design Lens
- **対象ブランチ**: `feature/phase1-mvp`（本番デプロイ中のブランチ）
- **ステータス**: 設計合意済み（実装計画作成前）
- **関連仕様書**: `docs/specs/2026-05-25-design-lens-spec.md`

---

## 1. 背景と目的

Design Lens は公開済み（https://design-lens-nu.vercel.app/ja）。現在の解析結果は「このデザインはこうなっている」という**観察・解析**に軸足がある7項目で構成されている。

本プロジェクトでは、アプリの根本目的である **「AI時代に"意図を持つ目"を育てる」** をより強く体現するため、解析結果に **「観察 → 学び → 改善 → 実践」** の学習ジャーニーを表現する4項目を追加する。

### 解決したい課題
- 現状は「観察」で止まっており、ユーザーの「学び」「自分で作る」への接続が弱い
- ユーザーが「もっと自分のためになる、欲しいと思う項目」を求めている

---

## 2. スコープ

### やること
- 解析結果に4項目を追加（視線の流れ / デザイン原則 / 改善提案 / 応用アイデア）
- AI解析プロンプトに新項目の指示を追加
- 解析結果画面（AnalysisCard）に新項目を「コンパクト+展開」で表示
- 日英の i18n ラベルを追加
- 後方互換性の確保（既存の保存データを壊さない）

### やらないこと（今回のスコープ外）
- 既存7項目の変更（設計意図・配色・タイポ・構図・ターゲット・抽出テキスト・カテゴリ）
- 再現プロンプト生成への新項目の反映（将来検討）
- 図鑑・類似検索など Phase 2 機能

---

## 3. 追加する4項目

学習ジャーニー「観察 → 学び → 改善 → 実践」に対応させる。

| 表示順 | 日本語ラベル | フィールド名 | データ型 | 役割 | 内容イメージ |
|--------|------------|------------|---------|------|------------|
| 1 | 👁 視線の流れ | `visualFlow` | 文字列（1〜2文） | 観察 | 「まず中央の大きな数字→次に商品名→最後に店名へ視線が動く」 |
| 2 | 💡 デザイン原則 | `principles` | `{name, description}[]` | 学び | タグ表示＋タップで一言解説（例: `ジャンプ率` `色彩心理`） |
| 3 | 🛠 もっと良くするなら | `improvements` | 文字列の配列（2〜3個） | 改善 | 「文字と背景のコントラストを強めると、より遠くからでも読みやすくなるかも」 |
| 4 | 🎨 応用アイデア | `applications` | 文字列の配列（2〜3個） | 実践 | 「この手法はカフェの新メニュー告知にも応用できそう」 |

---

## 4. データモデルの変更

### 4.1 `src/types/analysis.ts`

新スキーマ `PrincipleSchema` を追加し、`AnalysisResultSchema` に4フィールドを追記する。後方互換のため新フィールドはすべて `.default()` を付与する。

```typescript
export const PrincipleSchema = z.object({
  name: z.string(),        // 原則名（例: "ジャンプ率"）
  description: z.string(), // 日常語での一言解説
});

// AnalysisResultSchema に以下を追記
  visualFlow: z.string().default(''),
  principles: z.array(PrincipleSchema).default([]),
  improvements: z.array(z.string()).default([]),
  applications: z.array(z.string()).default([]),
```

型 `Principle = z.infer<typeof PrincipleSchema>` をエクスポートする。

### 4.2 `src/lib/db/schema.ts`

`AnalysisRecord` インターフェースに同じ4フィールドを追加する（型のみ。Dexieのインデックスは変更しない）。

```typescript
  visualFlow: string;
  principles: { name: string; description: string }[];
  improvements: string[];
  applications: string[];
```

---

## 5. 後方互換性（重要）

公開済みアプリのユーザーは、すでに解析結果を IndexedDB に保存している。**古いデータには新4項目が存在しない。**

### 対策
1. **スキーマ側**: 新フィールドに `.default('')` / `.default([])` を付与。古いデータを `safeParse` しても失敗しない
2. **表示側**: 「中身が空ならそのセクションを表示しない」。既存の「抽出テキスト（空なら非表示）」と同じパターンを踏襲
3. **データ移行**: 不要。古い解析結果は今まで通り表示され、新規撮影分から4項目が増える

---

## 6. AI解析プロンプトの変更

### `src/lib/claude/prompts.ts` の `buildAnalyzeSystemPrompt`

日本語版・英語版の両方のJSONスキーマに4項目を追記する。既存の出力ルール（観察と推測のトーン、専門用語＋日常語の併記、JSONのみ返す）は新項目にも適用する。

#### 日本語版スキーマへの追記
```
  "visualFlow": "string - 視線がどう動くか（最初に見る所→次→最後）を1〜2文で",
  "principles": [{ "name": "原則名（例: ジャンプ率）", "description": "日常語での一言解説" }],
  "improvements": ["string", ...] - もっと良くするなら、の改善案を2〜3個（断定せず柔らかく）",
  "applications": ["string", ...] - 別の業種・シーンへの応用アイデアを2〜3個"
```

#### 英語版スキーマへの追記
```
  "visualFlow": "string - how the eye moves (first → next → last) in 1-2 sentences",
  "principles": [{ "name": "principle name (e.g., visual hierarchy)", "description": "plain-language one-liner" }],
  "improvements": ["string", ...] - 2-3 gentle suggestions for improvement (avoid assertions)",
  "applications": ["string", ...] - 2-3 ideas for applying this to other industries/scenes"
```

#### 追加の指示文
- `principles` は「専門用語のタグ（name）＋必ず日常語の説明（description）」をセットにする → アプリの「両方併記の原則」を踏襲
- `improvements` は「観察と推測」のトーンで、断定を避けた柔らかい言い回しにする

---

## 7. UI表示の変更

### `src/components/analysis/AnalysisCard.tsx`

既存の `SectionCard` コンポーネントを再利用し、4つの新セクションを追加する。表示順は学習ジャーニー（観察→学び→改善→実践）に沿わせ、既存項目の後・AI注記の前に配置する。

```
設計意図（既存・大きく表示）
配色 / タイポ / 構図 / ターゲット / 抽出テキスト（既存）
─────────────────────────────
👁 視線の流れ（新）         … 短文をそのまま表示
💡 デザイン原則（新）       … タグchップ表示、タップで説明を展開
🛠 もっと良くするなら（新） … 箇条書き 2〜3個
🎨 応用アイデア（新）       … 箇条書き 2〜3個
─────────────────────────────
※AIによる観察と推測です（既存の注記）
```

### 表示ルール
- **空の項目は非表示**（後方互換 + AIが出せなかった場合の安全策）
- **デザイン原則のみ折りたたみ式**: タグ（name）を常時表示し、タップで説明（description）を展開。情報量を抑える
- 他の3項目は短いため常時表示
- アイコン（lucide-react）: 視線=`Eye`、原則=`Lightbulb`、改善=`Wrench`、応用=`Sparkles`

### i18n（`src/messages/ja.json` / `en.json`）
`analyze` セクションに以下のラベルキーを追加する。

| キー | ja | en |
|------|----|----|
| `visualFlow` | 視線の流れ | Visual flow |
| `principles` | デザイン原則 | Design principles |
| `improvements` | もっと良くするなら | Ideas to improve |
| `applications` | 応用アイデア | How to apply it |
| `principlesHint` | タップで解説を見る | Tap to see explanation |

---

## 8. エラー処理

- AIが新項目を返さなかった場合 → スキーマの `.default` で空になり、表示側で非表示。エラーにしない
- AIが不正なJSONを返した場合 → 既存の `tryParseJson` / `safeParse` の仕組みでそのまま処理（変更なし）
- `principles` の要素が不正な形（name欠落等）→ Zodがparse時に弾く。既存のエラーフローに乗る

---

## 9. テスト方針

| テスト対象 | ファイル | 確認内容 |
|-----------|---------|---------|
| スキーマ | `tests/unit/types/analysis.test.ts` | 新4項目を含むデータがparseできる / **新項目なしの古いデータもparseできる（後方互換）** / principlesの不正形を弾く |
| 表示 | `tests/unit/components/analysis/AnalysisCard.test.tsx` | 新項目あり→表示 / 空→非表示 / デザイン原則タグのタップで説明が展開 |
| Claudeクライアント | `tests/unit/lib/claude/client.test.ts` | モックレスポンスに新項目を含め、解析結果が正しく組み立てられる |
| 既存テスト全般 | 全テスト | すべてpassのまま（非破壊） |

AIプロンプトの「内容」自体はユニットテスト対象外。

---

## 10. 変更ファイル一覧

| ファイル | 変更内容 |
|----------|---------|
| `src/types/analysis.ts` | PrincipleSchema追加、AnalysisResultSchemaに4フィールド追加、型エクスポート |
| `src/lib/db/schema.ts` | AnalysisRecordに4フィールド追加（型のみ） |
| `src/lib/claude/prompts.ts` | 日英プロンプトのJSONスキーマに4項目追加、原則の併記ルール追記 |
| `src/components/analysis/AnalysisCard.tsx` | 新4セクション追加（空なら非表示、原則は展開式） |
| `src/messages/ja.json` | 新ラベル5キー追加 |
| `src/messages/en.json` | 新ラベル5キー追加 |
| `tests/unit/types/analysis.test.ts` | 後方互換・新項目のテスト追加 |
| `tests/unit/components/analysis/AnalysisCard.test.tsx` | 新項目表示・展開のテスト追加 |
| `tests/unit/lib/claude/client.test.ts` | モックに新項目追加 |

---

## 11. 設計原則の遵守

- **両方併記の原則**: `principles` で専門用語＋日常語を併記
- **観察と推測のトーン**: `improvements` を断定せず柔らかく
- **意図ファースト**: 設計意図は引き続き最上部。新項目はその後の学習ジャーニーとして配置
- **非破壊・後方互換**: 既存機能と既存データを壊さない
