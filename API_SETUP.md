# API 設定手順

このアプリケーションでは複数の検索 API を使用できます。以下の優先順位で試行され、利用可能な API で検索が実行されます。

## 検索 API 優先順位

1. **Google Custom Search API** （推奨）
2. **Serper API** （簡単設定）
3. **DuckDuckGo API** （制限あり、API キー不要）
4. **Mock データ** （フォールバック）

## 1. Google Custom Search API の設定

### 手順

1. **Google Cloud Console** にアクセス

   - <https://console.cloud.google.com/>

2. **新しいプロジェクトを作成** または既存のプロジェクトを選択

3. **Custom Search API を有効化**

   - API とサービス > ライブラリ
   - "Custom Search API" を検索して有効化

4. **API キーを作成**

   - API とサービス > 認証情報
   - "認証情報を作成" > "API キー"
   - 作成された API キーをコピー

5. **カスタム検索エンジンを作成**

   - <https://cse.google.com/> にアクセス
   - "新しい検索エンジン" を作成
   - 検索するサイト: `*` （すべてのサイト）
   - 検索エンジン ID をコピー

### 環境変数設定

```bash
GOOGLE_SEARCH_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

### 料金

- 1 日 100 クエリまで無料
- 追加クエリ: $5/1000 クエリ

## 2. Serper API の設定（推奨代替案）

### 手順

1. **Serper** にアクセス

   - <https://serper.dev/>

2. **アカウント登録**

   - Google アカウントまたは GitHub でサインアップ

3. **API キーを取得**
   - ダッシュボードから API キーをコピー

### 環境変数設定

```bash
SERPER_API_KEY=your_serper_api_key_here
```

### 料金

- 2,500 クエリ/月まで無料
- 追加クエリ: $5/1000 クエリ

## 3. DuckDuckGo API

- **API キー不要**
- 自動的に使用されます
- 制限: 基本的な検索結果のみ

## 環境変数の設定方法

1. **`.env.local` ファイルを編集**

```bash
# .env.local

# Google Custom Search API（推奨）
GOOGLE_SEARCH_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here

# または Serper API（簡単設定）
SERPER_API_KEY=your_serper_api_key_here
```

2. **開発サーバーを再起動**

```bash
pnpm run dev
```

## テスト方法

1. アプリケーションを起動
2. 任意の氏名で検索を実行
3. ブラウザの開発者ツール（Console）でどの API が使用されているかを確認

## API キーなしでのテスト

API キーが設定されていない場合、自動的にモックデータが表示されます。基本的な機能テストには十分です。

## 検索精度の向上

### Google Custom Search API の場合

1. **カスタム検索エンジンの設定を調整**

   - 特定のサイト（LinkedIn、会社サイトなど）を優先
   - 不要なサイトを除外

2. **検索クエリの調整**
   - `src/lib/search-apis/google-search.ts` の `query` を修正

### 検索対象サイトの例

- `linkedin.com`
- `company-websites.com`
- `business-directories.com`
- `news-sites.com`

## トラブルシューティング

### エラー: "API キーが設定されていません"

- `.env.local` ファイルが正しく設定されているか確認
- 開発サーバーを再起動

### エラー: "API error: 403"

- API キーが有効か確認
- API が有効化されているか確認
- 課金設定が必要な場合があります

### 検索結果が少ない

- 異なる検索クエリを試す
- 複数の API を組み合わせる
- 検索対象サイトを追加

## セキュリティ注意事項

- API キーを `.env.local` に保存し、`.gitignore` に含まれていることを確認
- 本番環境では適切な環境変数管理を使用
- API キーを定期的にローテーション
