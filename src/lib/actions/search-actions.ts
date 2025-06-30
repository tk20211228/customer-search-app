"use server";

import { searchPerson } from '@/lib/search-service';
import { SearchActionResult } from '@/types/actions';

export async function searchPersonAction(name: string): Promise<SearchActionResult> {
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

    // 検索実行
    console.log(`[Server Action] Searching for: ${name.trim()}`);
    const searchResponse = await searchPerson(name.trim());

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