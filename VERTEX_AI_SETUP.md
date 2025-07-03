# Vertex AI Search セットアップガイド

## 前提条件

- Google Cloud アカウント
- Webブラウザ（Chrome、Firefox、Safariなど）
- 課金設定が可能なクレジットカードまたは銀行口座

## Phase 1: Google Cloud 基盤設定

### 1. Google Cloud プロジェクトの設定

#### プロジェクトの作成
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 右上の「プロジェクトを選択」をクリック
3. 「新しいプロジェクト」をクリック
4. プロジェクト情報を入力：
   - **プロジェクト名**: `Customer Search App`
   - **プロジェクト ID**: `customer-search-[ランダム番号]`（自動生成されます）
5. 「作成」をクリック
6. 作成されたプロジェクトを選択

#### 課金の設定
1. 左側メニューから「お支払い」を選択
2. 「課金アカウントをリンク」をクリック
3. 既存の課金アカウントを選択するか、新しく作成
4. クレジットカード情報を入力（新規作成の場合）
5. 「課金アカウントを設定」をクリック

### 2. 必要な API の有効化

#### Discovery Engine API（Vertex AI Search）の有効化
1. 左側メニューから「API とサービス」→「ライブラリ」を選択
2. 検索ボックスに「Discovery Engine API」と入力
3. 「Discovery Engine API」を選択
4. 「有効にする」をクリック

#### その他必要なAPIの有効化
同様の手順で以下のAPIも有効化：
- **Cloud Storage API**
- **Vertex AI API**  
- **Cloud Resource Manager API**

確認方法：
1. 「API とサービス」→「有効な API」で一覧確認

### 3. サービスアカウントの作成

#### サービスアカウントの作成手順
1. 左側メニューから「IAM と管理」→「サービス アカウント」を選択
2. 「サービス アカウントを作成」をクリック
3. サービスアカウントの詳細を入力：
   - **サービス アカウント名**: `vertex-ai-search-service`
   - **サービス アカウント ID**: `vertex-ai-search-service`（自動入力）
   - **説明**: `Vertex AI Search用のサービスアカウント`
4. 「作成して続行」をクリック

#### 権限の付与
5. 「このサービス アカウントにプロジェクトへのアクセスを許可する」で以下のロールを追加：
   - `Discovery Engine Admin`
   - `Storage Admin`
6. 各ロールの追加方法：
   - 「ロールを選択」をクリック
   - 検索ボックスでロール名を検索
   - 該当ロールを選択
   - 「別のロールを追加」で次のロールを追加
7. 「続行」をクリック
8. 「完了」をクリック

#### サービスアカウントキーの作成
1. 作成したサービスアカウント（`vertex-ai-search-service`）をクリック
2. 「キー」タブを選択
3. 「鍵を追加」→「新しい鍵を作成」をクリック
4. キーのタイプで「JSON」を選択
5. 「作成」をクリック
6. JSONファイルが自動ダウンロードされます
7. ダウンロードしたファイルを `vertex-ai-key.json` にリネーム
8. プロジェクトのルートディレクトリに配置

## Phase 2: Vertex AI Search 設定

### 1. Search App の作成

#### Google Cloud Console での作業

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. Vertex AI → Search and Conversation に移動
3. 「Create App」をクリック

#### アプリ設定

- **アプリタイプ**: Search
- **コンテンツタイプ**: Unstructured data
- **会社ドメイン**: （オプション）あなたの会社ドメイン

### 2. データストアの作成

#### データソースの種類

以下から選択または組み合わせ：

**A. ウェブサイトデータ**

```
対象サイト例：
- 企業公式サイト
- 求人サイト（Indeed、リクナビ等）
- ビジネスSNS（LinkedIn等）
- 業界団体サイト
```

**B. 構造化データ**

```
CSVファイル形式：
氏名,住所,会社名,会社電話番号,役職,ソース
田中太郎,東京都渋谷区...,株式会社ABC,03-1234-5678,営業部長,企業サイト
```

**C. 既存データベース**

```
- BigQuery
- Cloud SQL
- Firestore
```

### 3. インデックスの設定

#### Cloud Storageバケットの作成（構造化データを使用する場合）

1. 左側メニューから「Cloud Storage」→「ブラウザ」を選択
2. 「バケットを作成」をクリック
3. バケットの設定：
   - **名前**: `your-project-id-vertex-search-data`（プロジェクトIDを使用）
   - **ロケーション**: `Region` → `asia-northeast1 (東京)`
   - **ストレージクラス**: `Standard`
   - **アクセス制御**: `均一`
4. 「作成」をクリック

#### サンプルデータの準備とアップロード

1. CSVファイルを作成（例：`enterprise_data.csv`）：
```csv
氏名,住所,会社名,会社電話番号,役職,ソース
田中太郎,東京都渋谷区渋谷1-1-1,株式会社ABC,03-1234-5678,営業部長,企業サイト
山田花子,大阪府大阪市中央区,XYZ商事株式会社,06-9876-5432,取締役,LinkedIn
```

2. 作成したバケットにファイルをアップロード：
   - 作成したバケットをクリック
   - 「ファイルをアップロード」をクリック
   - CSVファイルを選択してアップロード

#### データストアとインデックスの作成

1. 左側メニューから「Vertex AI」→「Search and Conversation」を選択
2. 「Create data store」をクリック
3. データソースを選択：
   - **Cloud Storage**: アップロードしたCSVファイル
   - **Website**: 企業サイトのURL
   - **BigQuery**: 既存のデータベース
4. データストアの設定を完了
5. インデックス作成を開始（数時間～数日かかる場合があります）

## Phase 3: アプリケーション統合

### 1. 環境変数の設定

`.env.local` ファイルを作成：

```env
# Google Cloud設定
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=global
VERTEX_AI_SEARCH_ENGINE_ID=your-engine-id
VERTEX_AI_SERVING_CONFIG_ID=default_config

# サービスアカウント
GOOGLE_APPLICATION_CREDENTIALS=./vertex-ai-key.json
```

### 2. 検索エンジン ID の取得

1. Google Cloud Console で「Vertex AI」→「Search and Conversation」を選択
2. 作成したSearch Appをクリック
3. アプリの詳細画面で以下の情報を確認：
   - **App ID**: これが `VERTEX_AI_SEARCH_ENGINE_ID` に使用する値です
   - **Project ID**: これが `GOOGLE_CLOUD_PROJECT_ID` に使用する値です
4. 各IDをコピーして `.env.local` ファイルに設定

### 3. アプリケーションのテスト

1. ターミナルでプロジェクトディレクトリに移動
2. 依存関係のインストール：
   ```bash
   npm install
   ```
3. 接続テストの実行：
   ```bash
   npm run test:vertex-ai
   ```
4. 問題がなければ開発サーバーを起動：
   ```bash
   npm run dev
   ```
5. ブラウザで `http://localhost:3000` にアクセス
6. 「企業検索」タブで動作確認

## Phase 4: データ品質向上

### 1. 検索クエリの最適化

検索クエリ例：

```javascript
// 効果的な検索クエリの例
"田中太郎 東京都渋谷区 会社 電話番号 役職";
"営業部長 株式会社ABC 03-1234-5678";
```

### 2. データソースの拡充

推奨データソース：

- 企業公式サイト
- LinkedIn
- Wantedly
- 業界団体の会員名簿
- 商工会議所データ
- 帝国データバンク（有料）
- 東京商工リサーチ（有料）

### 3. 検索精度の向上

```javascript
// 検索パラメータの調整
{
  "pageSize": 20,
  "filter": "confidence >= 0.7",
  "orderBy": "confidence desc",
  "contentSearchSpec": {
    "snippetSpec": {
      "returnSnippet": true,
      "maxSnippetCount": 5
    }
  }
}
```

## トラブルシューティング

### よくある問題と解決策

#### 1. 認証エラー

**症状**: 「認証に失敗しました」「権限がありません」などのエラー

**解決方法**:
1. サービスアカウントキーファイルの確認：
   - `vertex-ai-key.json` がプロジェクトのルートディレクトリにあることを確認
   - ファイルが破損していないか確認
2. 環境変数の設定確認：
   - `.env.local` ファイルの `GOOGLE_APPLICATION_CREDENTIALS` が正しく設定されているか確認
3. サービスアカウントの権限確認：
   - Google Cloud Console の「IAM と管理」でサービスアカウントに適切なロールが付与されているか確認
   - 必要なロール: `Discovery Engine Admin`、`Storage Admin`

#### 2. 検索結果が少ない

**症状**: 検索しても結果が0件または極端に少ない

**解決方法**:
1. データソースの確認：
   - Google Cloud Console の「Vertex AI」→「Search and Conversation」でデータストアの状態を確認
   - インデックス作成が完了しているか確認
2. データの追加：
   - より多くの企業データをCSVファイルまたはウェブサイトソースとして追加
   - データの品質を向上（重複削除、形式統一）
3. 検索クエリの調整：
   - より具体的なキーワードを使用
   - 部分一致検索を活用

#### 3. レスポンスが遅い

**症状**: 検索に10秒以上かかる、タイムアウトが発生する

**解決方法**:
1. データストアの最適化：
   - Google Cloud Console でデータストアのサイズと構成を確認
   - 不要なデータを削除してインデックスを軽量化
2. 検索クエリの最適化：
   - 検索範囲を絞り込む
   - `pageSize` を調整（デフォルト10件）
3. ネットワークの確認：
   - インターネット接続速度の確認
   - Google Cloud のリージョン設定を確認

## コスト管理

### 料金体系

- 検索リクエスト: $0.0025/リクエスト
- データストレージ: $0.024/GB/月
- インデックス作成: $0.05/1000 文書

### コスト削減のヒント

- 不要な検索を避ける
- キャッシュを活用
- 検索結果の上限設定
- 定期的なデータクリーンアップ

## 次のステップ

1. 基本設定の完了
2. サンプルデータでのテスト
3. 本格的なデータソース追加
4. 検索精度の調整
5. 本番環境へのデプロイ

## サポート情報

- [Vertex AI Search ドキュメント](https://cloud.google.com/vertex-ai-search-and-conversation)
- [Google Cloud サポート](https://cloud.google.com/support)
- [Community Support](https://stackoverflow.com/questions/tagged/google-cloud-vertex-ai)
