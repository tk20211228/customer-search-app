import { SearchServiceClient } from '@google-cloud/discoveryengine';
import { GoogleAuth } from 'google-auth-library';

export interface VertexAIConfig {
  projectId: string;
  location: string;
  engineId: string;
  servingConfigId?: string;
}

export class VertexAISearchClient {
  private client: SearchServiceClient;
  private config: VertexAIConfig;
  private isInitialized: boolean = false;

  constructor(config: VertexAIConfig) {
    this.config = config;
    this.validateConfig();
    this.initializeClient();
  }

  private validateConfig() {
    const errors: string[] = [];
    
    if (!this.config.projectId) {
      errors.push('projectId is required');
    }
    
    if (!this.config.engineId) {
      errors.push('engineId is required');
    }
    
    if (!this.config.location) {
      errors.push('location is required');
    }

    if (errors.length > 0) {
      throw new Error(`Vertex AI Search configuration error: ${errors.join(', ')}`);
    }
  }

  private initializeClient() {
    try {
      // Google Cloud認証の設定
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        // 環境変数GOOGLE_APPLICATION_CREDENTIALSからサービスアカウントキーを読み込み
      });

      this.client = new SearchServiceClient({
        auth,
      });

      this.isInitialized = true;
      console.log('✅ Vertex AI Search client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Vertex AI Search client:', error);
      throw new Error(`Failed to initialize Vertex AI Search client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async search(query: string, options?: {
    pageSize?: number;
    offset?: number;
    filter?: string;
    orderBy?: string;
  }) {
    if (!this.isInitialized) {
      throw new Error('Vertex AI Search client is not initialized');
    }

    const startTime = Date.now();
    
    try {
      const { projectId, location, engineId, servingConfigId = 'default_config' } = this.config;
      
      console.log(`🔍 Starting search for query: "${query}"`);
      console.log(`📍 Config: ${projectId}/${location}/${engineId}`);
      
      // Serving Configのパスを構築
      const servingConfig = this.client.projectLocationCollectionEngineServingConfigPath(
        projectId,
        location,
        'default_collection', // コレクション名（通常は default_collection）
        engineId,
        servingConfigId
      );

      console.log(`🎯 Serving config path: ${servingConfig}`);

      const request = {
        servingConfig,
        query: {
          text: query,
        },
        pageSize: options?.pageSize || 10,
        offset: options?.offset || 0,
        filter: options?.filter,
        orderBy: options?.orderBy,
        // 検索結果に含める情報を指定
        contentSearchSpec: {
          snippetSpec: {
            returnSnippet: true,
            maxSnippetCount: 3,
          },
          summarySpec: {
            summaryResultCount: 3,
            includeCitations: true,
          },
        },
      };

      console.log('📤 Sending search request to Vertex AI...');
      const [response] = await this.client.search(request);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Search completed in ${duration}ms`);
      console.log(`📊 Found ${response.results?.length || 0} results`);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Vertex AI Search error after ${duration}ms:`, error);
      
      // エラーの詳細分析
      if (error && typeof error === 'object' && 'code' in error) {
        const grpcError = error as any;
        switch (grpcError.code) {
          case 3:
            throw new Error('Invalid request parameters. Please check your query and configuration.');
          case 5:
            throw new Error('Search engine or serving config not found. Please verify your Engine ID.');
          case 7:
            throw new Error('Permission denied. Please check your service account permissions.');
          case 14:
            throw new Error('Service unavailable. Vertex AI Search may be experiencing issues.');
          default:
            throw new Error(`Vertex AI Search error (code ${grpcError.code}): ${grpcError.message}`);
        }
      }
      
      throw new Error(`Vertex AI Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchWithStructuredQuery(
    personName: string,
    options: {
      includeCompanyName?: boolean;
      includePhoneNumber?: boolean;
      includePosition?: boolean;
      includeAddress?: boolean;
      minConfidence?: number;
    } = {}
  ) {
    // 構造化されたクエリを作成
    const queryParts = [personName];
    
    if (options.includeCompanyName) {
      queryParts.push('会社名', '勤務先', 'company');
    }
    
    if (options.includePhoneNumber) {
      queryParts.push('電話番号', 'phone', 'tel');
    }
    
    if (options.includePosition) {
      queryParts.push('役職', '肩書き', 'position', '部長', '課長', '取締役');
    }
    
    if (options.includeAddress) {
      queryParts.push('住所', 'address', '所在地');
    }

    const query = queryParts.join(' ');
    
    // フィルターを構築（信頼度による絞り込み）
    let filter = '';
    if (options.minConfidence) {
      filter = `confidence >= ${options.minConfidence}`;
    }

    return this.search(query, {
      pageSize: 20,
      filter: filter || undefined,
      orderBy: 'confidence desc', // 信頼度の高い順でソート
    });
  }

  // 検索結果から企業情報を抽出するヘルパーメソッド
  extractEnterpriseInfo(searchResult: any) {
    try {
      const document = searchResult.document;
      const snippet = searchResult.snippet || '';
      
      // ドキュメントの構造化データまたはスニペットから情報を抽出
      const structuredData = document?.structData || {};
      
      return {
        companyName: this.extractField(structuredData, snippet, ['company_name', '会社名', 'organization']),
        phoneNumber: this.extractField(structuredData, snippet, ['phone', 'telephone', '電話番号', 'tel']),
        position: this.extractField(structuredData, snippet, ['position', 'title', '役職', '肩書き']),
        address: this.extractField(structuredData, snippet, ['address', '住所', 'location']),
        email: this.extractField(structuredData, snippet, ['email', 'mail', 'メール']),
        website: this.extractField(structuredData, snippet, ['website', 'url', 'homepage']),
        source: document?.uri || 'Unknown',
        confidence: this.calculateConfidence(searchResult),
      };
    } catch (error) {
      console.error('Error extracting enterprise info:', error);
      return null;
    }
  }

  private extractField(structuredData: any, snippet: string, fieldNames: string[]): string | undefined {
    // 構造化データから抽出を試行
    for (const fieldName of fieldNames) {
      if (structuredData[fieldName]) {
        return structuredData[fieldName];
      }
    }

    // スニペットからの正規表現による抽出
    for (const fieldName of fieldNames) {
      const regex = new RegExp(`${fieldName}[：:：\\s]*([^\\s\\n,]+)`, 'i');
      const match = snippet.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  private calculateConfidence(searchResult: any): number {
    // Vertex AI Searchのスコアを0-1の信頼度に変換
    const score = searchResult.relevanceScore || 0;
    
    // スコアの正規化（実際のスコア範囲に応じて調整が必要）
    return Math.min(Math.max(score / 100, 0), 1);
  }
}

// シングルトンインスタンス
let vertexAIClient: VertexAISearchClient | null = null;

export function getVertexAIClient(): VertexAISearchClient {
  if (!vertexAIClient) {
    const config: VertexAIConfig = {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
      location: process.env.GOOGLE_CLOUD_LOCATION || 'global',
      engineId: process.env.VERTEX_AI_SEARCH_ENGINE_ID || '',
      servingConfigId: process.env.VERTEX_AI_SERVING_CONFIG_ID || 'default_config',
    };

    // 設定の検証
    if (!config.projectId || !config.engineId) {
      throw new Error('Vertex AI Search configuration is incomplete. Please set GOOGLE_CLOUD_PROJECT_ID and VERTEX_AI_SEARCH_ENGINE_ID environment variables.');
    }

    vertexAIClient = new VertexAISearchClient(config);
  }

  return vertexAIClient;
}