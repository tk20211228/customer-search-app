"use server";

import { 
  EnterpriseSearchRequest, 
  EnterpriseSearchResponse, 
  EnterpriseSearchFormData 
} from '@/types/enterprise-search';
import { getVertexAISearchService } from '@/lib/vertex-ai/search-service';
import { ActionResult } from '@/types/actions';

export async function searchEnterpriseAction(
  formData: EnterpriseSearchFormData
): Promise<ActionResult<EnterpriseSearchResponse>> {
  try {
    console.log('🚀 Enterprise search action started', {
      personName: formData.personName,
      personAddress: formData.personAddress,
      searchPrecision: formData.searchPrecision,
      searchTargets: formData.searchTargets,
    });

    // バリデーション
    if (!formData.personName?.trim()) {
      return {
        success: false,
        error: '氏名を入力してください',
      };
    }

    if (!formData.personAddress?.trim()) {
      return {
        success: false,
        error: '住所を入力してください',
      };
    }

    // 検索リクエストの構築
    const searchRequest: EnterpriseSearchRequest = {
      personName: formData.personName.trim(),
      personAddress: formData.personAddress.trim(),
      searchOptions: {
        includeCompanyName: formData.searchTargets.companyName,
        includeCompanyPhone: formData.searchTargets.companyPhone,
        includePosition: formData.searchTargets.position,
        minConfidence: formData.searchPrecision === 'high' ? 0.7 : 0.5,
      },
    };

    console.log('📋 Search request prepared:', searchRequest);

    // Vertex AI Searchサービスの実行
    const searchService = getVertexAISearchService();
    const result = await searchService.searchEnterprise(searchRequest);

    console.log('✅ Enterprise search completed', {
      resultCount: result.totalCount,
      searchTime: result.searchTime,
    });

    return {
      success: true,
      data: result,
    };

  } catch (error) {
    console.error('❌ Enterprise search action failed:', error);

    // エラーの詳細分析とユーザーフレンドリーなメッセージ
    let errorMessage = '企業検索中にエラーが発生しました';

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('configuration')) {
        errorMessage = 'Vertex AI Searchの設定に問題があります。管理者にお問い合わせください。';
      } else if (message.includes('permission')) {
        errorMessage = 'アクセス権限がありません。管理者にお問い合わせください。';
      } else if (message.includes('not found')) {
        errorMessage = '検索エンジンが見つかりません。設定を確認してください。';
      } else if (message.includes('quota') || message.includes('limit')) {
        errorMessage = 'API使用量の上限に達しました。しばらく時間をおいて再試行してください。';
      } else if (message.includes('network') || message.includes('timeout')) {
        errorMessage = 'ネットワークエラーが発生しました。接続を確認して再試行してください。';
      } else if (message.includes('service unavailable')) {
        errorMessage = 'サービスが一時的に利用できません。しばらく時間をおいて再試行してください。';
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// デバッグ用の設定確認アクション
export async function checkVertexAIConfigAction(): Promise<ActionResult<{
  isConfigured: boolean;
  missingConfig: string[];
  projectId?: string;
  engineId?: string;
}>> {
  try {
    const missingConfig: string[] = [];
    
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const engineId = process.env.VERTEX_AI_SEARCH_ENGINE_ID;
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!projectId) missingConfig.push('GOOGLE_CLOUD_PROJECT_ID');
    if (!engineId) missingConfig.push('VERTEX_AI_SEARCH_ENGINE_ID');
    if (!credentials) missingConfig.push('GOOGLE_APPLICATION_CREDENTIALS');

    const isConfigured = missingConfig.length === 0;

    console.log('🔧 Vertex AI configuration check:', {
      isConfigured,
      missingConfig,
      hasProjectId: !!projectId,
      hasEngineId: !!engineId,
      hasCredentials: !!credentials,
    });

    return {
      success: true,
      data: {
        isConfigured,
        missingConfig,
        projectId: projectId || undefined,
        engineId: engineId || undefined,
      },
    };

  } catch (error) {
    console.error('❌ Configuration check failed:', error);
    
    return {
      success: false,
      error: '設定確認中にエラーが発生しました',
    };
  }
}

// テスト用の検索アクション
export async function testVertexAISearchAction(
  testQuery: string = '田中太郎 東京都'
): Promise<ActionResult<{
  isWorking: boolean;
  responseTime: number;
  resultCount: number;
  error?: string;
}>> {
  try {
    console.log('🧪 Testing Vertex AI Search with query:', testQuery);

    const startTime = Date.now();
    
    const searchRequest: EnterpriseSearchRequest = {
      personName: testQuery.split(' ')[0] || 'テスト',
      personAddress: testQuery.split(' ').slice(1).join(' ') || '東京都',
      searchOptions: {
        includeCompanyName: true,
        includeCompanyPhone: true,
        includePosition: true,
        minConfidence: 0.5,
      },
    };

    const searchService = getVertexAISearchService();
    const result = await searchService.searchEnterprise(searchRequest);
    
    const responseTime = Date.now() - startTime;

    console.log('✅ Vertex AI Search test completed:', {
      responseTime,
      resultCount: result.totalCount,
    });

    return {
      success: true,
      data: {
        isWorking: true,
        responseTime,
        resultCount: result.totalCount,
      },
    };

  } catch (error) {
    console.error('❌ Vertex AI Search test failed:', error);

    const responseTime = Date.now();
    
    return {
      success: true,
      data: {
        isWorking: false,
        responseTime,
        resultCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}