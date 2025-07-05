# 顧客名簿検索アプリ - Customer Search App

## プロジェクト概要

顧客名簿に記載された氏名をもとにインターネット検索を行い、該当する会社名や勤務先住所を出力できる Web アプリケーション。

## 主要機能

### 1. 氏名検索フォーム

- 氏名を入力するフォームがある
- バリデーション機能（必須入力チェック）
- 検索ボタンで検索実行

### 2. インターネット検索機能

- 入力された氏名をもとにインターネット検索を実行
- 検索結果から会社名、勤務先住所などの情報を抽出
- 複数の検索結果を構造化して表示

### 3. 検索結果表示

- 検索結果の一覧表示
- 会社名、勤務先住所などの情報を整理して表示
- 各結果にチェックボックスを配置
- ユーザーが必要な情報を選択可能

### 4. エクスポート機能

- 「エクスポート」ボタンで Excel 形式での出力
- チェック済みの情報のみを出力
- Excel 形式（.xlsx）でダウンロード

## 技術仕様

### フロントエンド

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

### 主要ライブラリ

- **Excel 出力**: xlsx
- **UI Components**:
  - @radix-ui/react-slot
  - @radix-ui/react-label
  - @radix-ui/react-checkbox
- **Utility**:
  - clsx
  - tailwind-merge
  - class-variance-authority

## ユーザーストーリー

### 基本フロー

1. ユーザーが氏名入力フォームに名前を入力
2. 検索ボタンをクリック
3. システムがインターネット検索を実行
4. 検索結果が一覧で表示される（会社名、勤務先住所等）
5. ユーザーが必要な情報にチェックを入れる
6. エクスポートボタンをクリック
7. チェック済み情報が Excel 形式でダウンロードされる

## 開発要件

### 必須機能

- [x] プロジェクトセットアップ（Next.js + TypeScript + Tailwind CSS）
- [x] shadcn/ui セットアップ
- [x] Excel 出力ライブラリ（xlsx）インストール
- [x] 氏名入力フォームコンポーネント
- [x] 検索結果表示コンポーネント
- [x] インターネット検索 API 統合（Google、Serper、DuckDuckGo）
- [x] Excel エクスポート機能
- [x] サーバーアクションによる検索実装
- [x] 複数検索APIのフォールバック機能

### UI/UX 要件

- レスポンシブデザイン
- ローディング状態の表示
- エラーハンドリング
- 直感的な操作性

### パフォーマンス要件

- 検索結果の高速表示
- 大量データのエクスポート対応
- クライアントサイドでの効率的な処理

## セキュリティ考慮事項

- 入力値のサニタイゼーション
- API キーの適切な管理
- CORS 設定の適切な実装

## 今後の拡張予定

- 検索履歴機能
- フィルタリング機能
- 複数形式でのエクスポート（CSV、PDF 等）
- 検索精度の向上

## 開発環境

- Node.js
- npm/pnpm
- Git

## コマンド

- 開発サーバー起動: `npm run dev`
- ビルド: `npm run build`
- リント: `npm run lint`
- 型チェック: `npx tsc --noEmit`

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

---

# 新機能：顧客管理システム実装プラン

## 実装概要

既存の検索機能を拡張し、エクセルファイルから顧客データをインポートし、4つの検索媒体（Google、Facebook、LinkedIn、Eight）を使った情報収集・管理システムを構築します。

## 統合実装プラン：環境構築 + 顧客管理システム

### フェーズ1: 環境構築

#### 1.1 Supabase設定
- Supabaseプロジェクト作成（手動作業）
- 環境変数を.env.localに追加
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
- SQLエディタで4つのテーブル作成
  - properties（物件）
  - customers（顧客）
  - search_records（検索記録）
  - search_logs（操作ログ）
- インデックスとRLSポリシー設定

#### 1.2 プロジェクト設定
- Supabase関連パッケージインストール
  ```bash
  npm install @supabase/supabase-js
  ```
- Supabaseクライアント設定（/src/lib/supabase.ts）
- 型定義ファイル生成（/src/types/supabase.ts）

#### 1.3 追加パッケージインストール
```bash
npm install react-dropzone sonner @tanstack/react-table
```

### フェーズ2: 顧客管理システム実装

#### 2.1 ディレクトリ構成
```
/src/app/customer-management/
├── page.tsx                    # ダッシュボード
├── upload/
│   └── page.tsx               # アップロード画面
├── [propertyId]/
│   ├── page.tsx               # 顧客一覧
│   └── [customerId]/
│       └── page.tsx           # 顧客詳細・検索
└── components/
    ├── property-card.tsx      # 物件カード
    ├── customer-table.tsx     # 顧客テーブル
    ├── search-tabs.tsx        # 4媒体タブ
    ├── candidate-form.tsx     # 候補入力フォーム
    └── excel-dropzone.tsx     # ドロップゾーン
```

#### 2.2 主要機能実装

##### A. ダッシュボード機能
- 物件一覧表示（グリッドレイアウト）
- 進捗状況インジケーター
- 新規アップロードボタン

##### B. エクセルアップロード機能
- ドラッグ&ドロップ対応
- データプレビュー表示
- バリデーション処理
- 一括インポート

##### C. 顧客一覧機能
- データテーブル（ソート・フィルター）
- 検索ステータス表示
- ページネーション
- エクセルエクスポート

##### D. 顧客詳細・検索機能
- 4つの検索媒体タブ
  - Google検索（検索フォーム付き）
  - Facebook検索（外部リンク）
  - LinkedIn検索（外部リンク）
  - Eight検索（クリップボード連携）
- 各媒体3候補入力（計12候補）
- 記録項目（9項目/候補）
  1. 会社名（必須）
  2. 会社電話番号
  3. 役職（必須）
  4. 部署名
  5. 会社住所
  6. メールアドレス
  7. 出典先URL（必須）
  8. 信頼度（1-5）
  9. メモ
- 他媒体情報の参照パネル
- リアルタイム自動保存

#### 2.3 API実装
- `/src/lib/actions/customer-actions.ts`
  - uploadExcel（エクセルアップロード）
  - getProperties（物件一覧取得）
  - getCustomers（顧客一覧取得）
  - saveSearchRecord（検索記録保存）
  - exportToExcel（エクセルエクスポート）

#### 2.4 SWR設定
- `/src/hooks/use-properties.ts`
- `/src/hooks/use-customers.ts`
- `/src/hooks/use-search-records.ts`
- リアルタイム更新対応

#### 2.5 UI/UXポリッシュ
- ローディング状態
- エラーハンドリング
- トースト通知（Sonner）
- レスポンシブデザイン
- アクセシビリティ対応

### フェーズ3: テストと最適化
- 機能テスト
- パフォーマンス最適化
- セキュリティ確認
- デプロイ準備

## データベース設計詳細

### properties（物件）テーブル
```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  total_customers INTEGER DEFAULT 0,
  completed_customers INTEGER DEFAULT 0,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### customers（顧客）テーブル
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_name VARCHAR(255) NOT NULL,
  owner_address TEXT,
  room_number VARCHAR(50),
  search_status VARCHAR(50) DEFAULT 'pending',
  last_searched_at TIMESTAMP WITH TIME ZONE,
  original_data JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### search_records（検索記録）テーブル
```sql
CREATE TABLE search_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  search_source VARCHAR(50) NOT NULL,
  candidate_number INTEGER NOT NULL CHECK (candidate_number BETWEEN 1 AND 3),
  company_name VARCHAR(255),
  company_phone VARCHAR(50),
  position VARCHAR(255),
  source_url TEXT,
  department VARCHAR(255),
  company_address TEXT,
  email VARCHAR(255),
  confidence_score INTEGER CHECK (confidence_score BETWEEN 1 AND 5),
  is_primary BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  UNIQUE(customer_id, search_source, candidate_number)
);
```

### search_logs（操作ログ）テーブル
```sql
CREATE TABLE search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  search_source VARCHAR(50) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  query_params JSONB,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255)
);
```

## 実装順序
1. 環境構築（Supabase + パッケージ）
2. 基本レイアウト作成
3. エクセルアップロード機能
4. 顧客一覧・詳細画面
5. 検索・記録機能
6. エクスポート機能
7. 最終調整

---

# 実装進捗状況 (2025-07-05)

## 完了した作業

### 1. 環境構築
- ✅ Supabase関連パッケージのインストール (`@supabase/supabase-js`)
- ✅ 環境変数ファイル(.env.local)の更新
  - Supabase URL、Anon Key、Service Role Key設定済み
- ✅ Supabaseクライアントの設定ファイル作成 (`/src/lib/supabase.ts`)
- ✅ 追加パッケージのインストール
  - `react-dropzone` (ファイルアップロード)
  - `sonner` (トースト通知)
  - `@tanstack/react-table` (テーブル管理)
- ✅ 必要なshadcn/uiコンポーネントの追加
  - badge, table, tabs, textarea, label

### 2. ディレクトリ構造の作成
- ✅ `/src/app/customer-management/` 以下のディレクトリ構造作成
  - `page.tsx` (ダッシュボード)
  - `upload/page.tsx` (アップロード画面)
  - `[propertyId]/page.tsx` (顧客一覧)
  - `[propertyId]/[customerId]/page.tsx` (顧客詳細)
  - `components/` (共通コンポーネント)

### 3. 実装済み機能
- ✅ ダッシュボード画面
  - 物件一覧表示
  - 統計情報（総物件数、総顧客数、調査完了数）
  - 進捗率表示
- ✅ エクセルアップロード機能
  - ドラッグ&ドロップ対応
  - データプレビュー
  - 一括インポート
- ✅ 顧客一覧画面
  - 検索・フィルター機能
  - ステータスバッジ表示
  - エクセルエクスポート機能
- ✅ 顧客詳細・検索画面
  - 4つの検索媒体タブ（Google、Facebook、LinkedIn、Eight）
  - 各媒体3候補の入力フォーム
  - Google検索統合
  - 外部リンク生成
  - リアルタイム保存

### 4. 型定義
- ✅ `/src/types/customer.ts` に全てのテーブル型定義を作成

### 5. UI/UX
- ✅ Sonnerによるトースト通知設定
- ✅ レスポンシブデザイン対応
- ✅ ローディング状態の実装

## 未完了の作業

### 1. Supabaseデータベース設定
- ✅ テーブルの作成（2025-07-05完了 - 全てTEXT型で実装）
- ✅ RLSポリシーの設定（開発用の全許可ポリシー設定済み）
- ✅ インデックス作成（パフォーマンス向上のため）
- ✅ updated_atトリガー設定（自動更新）

### 2. 今後の拡張機能
- ⏳ 認証機能の実装
- ⏳ より詳細な権限管理
- ⏳ 検索履歴の可視化
- ⏳ 統計ダッシュボードの拡充

## 次のステップ

1. **Supabaseダッシュボードでテーブル作成**
   - 上記のSQLスクリプトをSQL Editorで実行
   
2. **動作確認**
   ```bash
   pnpm run dev
   ```
   - http://localhost:3000/customer-management にアクセス

3. **テストデータの準備**
   - サンプルエクセルファイルの作成
   - アップロードテスト

## 注意事項
- 現在のRLSポリシーは開発用（全許可）なので、本番環境では認証ベースに変更が必要
- MCPサーバーの設定は環境により追加設定が必要な場合あり

## エクセルファイル形式
アップロード・エクスポートで使用するエクセルファイルは以下の形式です：

| 列名 | 説明 | 例 |
|------|------|-----|
| 物件名 | 物件の名称 | インザグレイス弁天町Ⅱみなと通 |
| 号室 | 部屋番号 | 101 |
| m | 平米数 | （空欄可） |
| 所有者 | 所有者氏名 | 可須水一史 |
| 状況 | 状況メモ | （空欄可） |
| 自宅番号 | 自宅電話番号 | （空欄可） |
| 勤務先 | 勤務先名称 | （空欄可） |
| 勤務先番号 | 勤務先電話番号 | （空欄可） |
| メモ | 備考 | （空欄可） |
| 本人携帯 | 携帯電話番号 | （空欄可） |
| 所有者住所 | 住所 | 東京都 |

※ ヘッダー行は自動判定されます（「物件名」「号室」「所有者」のいずれかが含まれている場合）