"use server";

import { searchPerson } from '@/lib/search-service';
import { SearchActionResult } from '@/types/actions';
import { parseAddress } from '@/lib/address-parser';
import { SearchResult } from '@/types/search';

export async function searchPersonAction(name: string, address?: string, excludeKeywords?: string[]): Promise<SearchActionResult> {
  try {
    // 入力値の検証
    if (!name || typeof name !== 'string' || !name.trim()) {
      return {
        success: false,
        error: '検索キーワードが入力されていません'
      };
    }

    // 名前の長さ制限
    if (name.trim().length > 50) {
      return {
        success: false,
        error: '検索キーワードが長すぎます（50文字以内で入力してください）'
      };
    }

    // 住所を解析
    const parsedAddress = address ? parseAddress(address) : {};
    
    console.log(`[Server Action] Searching for: ${name.trim()}${parsedAddress.prefecture ? ` in ${parsedAddress.prefecture}` : ''}${parsedAddress.remainingAddress ? ` at ${parsedAddress.remainingAddress}` : ''}${excludeKeywords && excludeKeywords.length > 0 ? ` excluding: ${excludeKeywords.join(', ')}` : ''}`);
    const searchResponse = await searchPerson(name.trim(), parsedAddress.prefecture, parsedAddress.remainingAddress, excludeKeywords);

    return {
      success: true,
      data: searchResponse
    };

  } catch (error) {
    console.error('[Server Action] Search error:', error);
    
    // エラーメッセージの安全な処理
    const errorMessage = error instanceof Error 
      ? error.message 
      : '検索中に予期しないエラーが発生しました';

    return {
      success: false,
      error: errorMessage
    };
  }
}

// ページネーション対応の検索アクション
export async function searchPersonActionPaginated(
  name: string,
  address?: string,
  excludeKeywords?: string[],
  page: number = 0,
  limit: number = 10
): Promise<{
  results: SearchResult[];
  hasMore: boolean;
  totalCount: number;
  page: number;
}> {
  try {
    // 入力値の検証
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new Error('検索キーワードが入力されていません');
    }

    // 名前の長さ制限
    if (name.trim().length > 50) {
      throw new Error('検索キーワードが長すぎます（50文字以内で入力してください）');
    }

    // 住所を解析
    const parsedAddress = address ? parseAddress(address) : {};
    
    console.log(`[Server Action Paginated] Searching for: ${name.trim()}${parsedAddress.prefecture ? ` in ${parsedAddress.prefecture}` : ''}${parsedAddress.remainingAddress ? ` at ${parsedAddress.remainingAddress}` : ''}${excludeKeywords && excludeKeywords.length > 0 ? ` excluding: ${excludeKeywords.join(', ')}` : ''} (page: ${page})`);
    
    const searchResponse = await searchPerson(name.trim(), parsedAddress.prefecture, parsedAddress.remainingAddress, excludeKeywords, page);
    
    // 結果を直接返す（各ページごとに実際のAPI呼び出し）
    const pageResults = searchResponse.results.slice(0, limit);
    
    // Google APIからの実際のhasNextPageを使用
    const hasMore = searchResponse.hasNextPage || false;

    console.log(`[Server Action Paginated] Page ${page}: ${pageResults.length} results, hasMore: ${hasMore}, totalResults: ${searchResponse.totalResults}`);

    return {
      results: pageResults,
      hasMore,
      totalCount: searchResponse.totalResults, // Google APIからの正確な総件数
      page
    };

  } catch (error) {
    console.error('[Server Action Paginated] Search error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : '検索中に予期しないエラーが発生しました';

    throw new Error(errorMessage);
  }
}