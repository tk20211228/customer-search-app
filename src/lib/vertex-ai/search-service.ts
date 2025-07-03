import { getVertexAIClient } from './client';
import { 
  EnterpriseSearchRequest, 
  EnterpriseSearchResponse, 
  EnterpriseSearchResult 
} from '@/types/enterprise-search';

export class VertexAISearchService {
  private client = getVertexAIClient();

  async searchEnterprise(request: EnterpriseSearchRequest): Promise<EnterpriseSearchResponse> {
    const startTime = Date.now();

    try {
      // 氏名と住所を組み合わせた検索クエリを作成
      const query = `${request.personName} ${request.personAddress}`;
      
      // Vertex AI Searchを実行
      const searchResponse = await this.client.searchWithStructuredQuery(
        query,
        {
          includeCompanyName: request.searchOptions?.includeCompanyName ?? true,
          includePhoneNumber: request.searchOptions?.includeCompanyPhone ?? true,
          includePosition: request.searchOptions?.includePosition ?? true,
          includeAddress: false, // 住所は入力情報として使用
          minConfidence: request.searchOptions?.minConfidence ?? 0.5,
        }
      );

      // 検索結果を変換
      const results: EnterpriseSearchResult[] = [];
      
      if (searchResponse.results) {
        for (const [index, result] of searchResponse.results.entries()) {
          const enterpriseInfo = this.client.extractEnterpriseInfo(result);
          
          if (enterpriseInfo) {
            results.push({
              id: `vertex-${index}`,
              personName: request.personName,
              personAddress: request.personAddress,
              companyName: enterpriseInfo.companyName || '',
              position: enterpriseInfo.position,
              companyPhone: enterpriseInfo.phoneNumber,
              source: this.getSourceType(enterpriseInfo.source),
              confidence: enterpriseInfo.confidence,
              lastUpdated: new Date().toISOString(),
            });
          }
        }
      }

      // 結果を信頼度でソート
      results.sort((a, b) => b.confidence - a.confidence);

      const searchTime = Date.now() - startTime;

      return {
        results,
        totalCount: results.length,
        query: `${request.personName} ${request.personAddress}`,
        searchTime,
      };

    } catch (error) {
      console.error('Vertex AI Search Service error:', error);
      
      // エラーが発生した場合でも、フォールバック検索を試行
      return this.fallbackSearch(request, Date.now() - startTime);
    }
  }

  private async fallbackSearch(
    request: EnterpriseSearchRequest, 
    searchTime: number
  ): Promise<EnterpriseSearchResponse> {
    // フォールバック: 既存のGoogle検索を使用
    try {
      // ここで既存のGoogle検索APIを呼び出し
      // 現在は簡単なモックデータを返す
      const mockResults: EnterpriseSearchResult[] = [
        {
          id: 'fallback-1',
          personName: request.personName,
          personAddress: request.personAddress,
          companyName: '検索結果が見つかりませんでした',
          source: 'Fallback Search',
          confidence: 0.1,
          lastUpdated: new Date().toISOString(),
        }
      ];

      return {
        results: mockResults,
        totalCount: mockResults.length,
        query: `${request.personName} ${request.personAddress}`,
        searchTime,
      };
    } catch (fallbackError) {
      console.error('Fallback search also failed:', fallbackError);
      
      return {
        results: [],
        totalCount: 0,
        query: `${request.personName} ${request.personAddress}`,
        searchTime,
      };
    }
  }

  private getSourceType(sourceUrl: string): string {
    if (sourceUrl.includes('linkedin.com')) return 'LinkedIn';
    if (sourceUrl.includes('facebook.com')) return 'Facebook';
    if (sourceUrl.includes('twitter.com') || sourceUrl.includes('x.com')) return 'Twitter/X';
    if (sourceUrl.includes('wantedly.com')) return 'Wantedly';
    if (sourceUrl.includes('corp.') || sourceUrl.includes('.co.jp')) return '企業公式サイト';
    if (sourceUrl.includes('news') || sourceUrl.includes('press')) return 'ニュース・プレスリリース';
    return 'Web検索';
  }

  // 検索精度を向上させるためのクエリ最適化
  optimizeQuery(personName: string, searchTargets: any): string {
    const queryParts = [personName];

    // 検索対象に応じてクエリを拡張
    if (searchTargets.companyName) {
      queryParts.push('勤務先', '所属', '会社');
    }

    if (searchTargets.phoneNumber) {
      queryParts.push('連絡先', '電話');
    }

    if (searchTargets.position) {
      queryParts.push('役職', '職位');
    }

    if (searchTargets.address) {
      queryParts.push('住所', '所在地');
    }

    return queryParts.join(' ');
  }

  // 結果の重複除去
  deduplicateResults(results: EnterpriseSearchResult[]): EnterpriseSearchResult[] {
    const seen = new Set<string>();
    const deduplicated: EnterpriseSearchResult[] = [];

    for (const result of results) {
      // 会社名と会社電話番号をキーとして重複チェック
      const key = `${result.companyName}-${result.companyPhone || ''}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(result);
      }
    }

    return deduplicated;
  }

  // 結果の信頼性向上
  enhanceResultConfidence(results: EnterpriseSearchResult[]): EnterpriseSearchResult[] {
    return results.map(result => {
      let confidence = result.confidence;

      // 企業公式サイトからの情報は信頼度を上げる
      if (result.source === '企業公式サイト') {
        confidence = Math.min(confidence + 0.2, 1.0);
      }

      // 複数の情報が揃っている場合は信頼度を上げる
      const infoCount = [
        result.companyName,
        result.companyPhone,
        result.position
      ].filter(Boolean).length;
      
      if (infoCount >= 2) {
        confidence = Math.min(confidence + 0.1, 1.0);
      }

      return {
        ...result,
        confidence,
      };
    });
  }
}

// シングルトンインスタンス
let searchService: VertexAISearchService | null = null;

export function getVertexAISearchService(): VertexAISearchService {
  if (!searchService) {
    searchService = new VertexAISearchService();
  }
  return searchService;
}