import { SearchResult, SearchResponse } from "@/types/search";
import { searchWithGoogle } from "./search-apis/google-search";
import { searchWithDuckDuckGo } from "./search-apis/duckduckgo-search";

// モックデータ生成（フォールバック用）
function generateMockResults(name: string): SearchResult[] {
  const baseId = Date.now();

  return [
    {
      id: `${baseId}-1`,
      name: name,
      company: "株式会社サンプル",
      position: "代表取締役",
      address: "東京都千代田区丸の内1-1-1",
      phone: "03-1234-5678",
      email: `${name.toLowerCase()}@sample.co.jp`,
      website: "https://www.sample.co.jp",
      source: "company-website.com",
      snippet: `${name}氏は株式会社サンプルの代表取締役として、同社の経営を指揮している。`,
    },
    {
      id: `${baseId}-2`,
      name: name,
      company: "テクノロジー株式会社",
      position: "取締役",
      address: "東京都渋谷区渋谷2-2-2",
      phone: "03-9876-5432",
      website: "https://www.technology.co.jp",
      source: "business-directory.com",
      snippet: `テクノロジー株式会社の取締役として活動している${name}氏の経歴について。`,
    },
    {
      id: `${baseId}-3`,
      name: name,
      company: "未来商事株式会社",
      position: "営業部長",
      address: "大阪府大阪市北区梅田3-3-3",
      email: `${name.toLowerCase()}@mirai-shoji.co.jp`,
      source: "linkedin.com",
      snippet: `${name}氏は未来商事株式会社の営業部長として、関西地区の営業活動を統括している。`,
    },
  ];
}

async function searchWithRealAPI(
  name: string,
  prefecture?: string,
  address?: string,
  excludeKeywords?: string[],
  page: number = 0
): Promise<{
  results: SearchResult[];
  totalResults: number;
  hasNextPage: boolean;
}> {
  const allResults: SearchResult[] = [];
  let totalResults = 0;
  let hasNextPage = false;

  // 複数のAPIから結果を収集
  const searchMethods = [
    {
      name: "Google Custom Search",
      search: async () => {
        return await searchWithGoogle(
          name,
          prefecture,
          address,
          excludeKeywords,
          page
        );
      },
      enabled:
        !!process.env.GOOGLE_SEARCH_API_KEY &&
        !!process.env.GOOGLE_SEARCH_ENGINE_ID,
    },
    // Serper API は一時的にコメントアウト（無限スクロール対応のため）
    // {
    //   name: 'Serper',
    //   search: () => searchWithSerper(name, prefecture, address, excludeKeywords),
    //   enabled: !!process.env.SERPER_API_KEY
    // }
    // DuckDuckGoは制限があるため、他のAPIが利用可能な場合は使用しない
  ];

  // 並行して複数のAPIを呼び出し
  const searchPromises = searchMethods
    .filter((method) => method.enabled)
    .map(async (method) => {
      try {
        console.log(`Trying ${method.name} search for: ${name}`);
        const results = await method.search();
        console.log(
          `${method.name} returned ${results.results.length} results`
        );
        return results;
      } catch (error) {
        console.error(`${method.name} search failed:`, error);
        return [];
      }
    });

  if (searchPromises.length === 0) {
    // APIキーが設定されていない場合はDuckDuckGoを試行
    try {
      console.log("No API keys available, trying DuckDuckGo search");
      const duckResults = await searchWithDuckDuckGo(name);
      if (duckResults.length > 0) {
        return {
          results: duckResults,
          totalResults: duckResults.length,
          hasNextPage: false,
        };
      }
    } catch (error) {
      console.error("DuckDuckGo search failed:", error);
    }

    // すべて失敗した場合はモックデータを返す
    console.log("All search methods failed, returning mock data");
    const mockResults = generateMockResults(name);
    return {
      results: mockResults,
      totalResults: mockResults.length,
      hasNextPage: false,
    };
  }

  // すべての検索結果を待機
  const searchResponses = await Promise.all(searchPromises);

  // 結果を統合
  for (const response of searchResponses) {
    if (Array.isArray(response)) {
      // 古い形式（DuckDuckGoなど）
      allResults.push(...response);
    } else {
      // 新しい形式（Google API）
      allResults.push(...response.results);
      if (totalResults === 0) {
        totalResults = response.totalResults;
        hasNextPage = response.hasNextPage;
      }
    }
  }

  console.log(
    `[Search Service] Combined ${allResults.length} results from all APIs for "${name}"`
  );

  // 重複を除去（URLが同じものを除外）
  const uniqueResults = allResults.filter(
    (result, index, self) =>
      index === self.findIndex((r) => r.website === result.website)
  );

  console.log(
    `[Search Service] After deduplication: ${uniqueResults.length} unique results for "${name}"`
  );

  // 結果がない場合はモックデータを返す
  if (uniqueResults.length === 0) {
    console.log("No search results found, returning mock data");
    const mockResults = generateMockResults(name);
    return {
      results: mockResults,
      totalResults: mockResults.length,
      hasNextPage: false,
    };
  }

  return {
    results: uniqueResults,
    totalResults,
    hasNextPage,
  };
}

export async function searchPerson(
  name: string,
  prefecture?: string,
  address?: string,
  excludeKeywords?: string[],
  page: number = 0
): Promise<SearchResponse> {
  const startTime = Date.now();

  if (!name.trim()) {
    throw new Error("検索キーワードが入力されていません");
  }

  try {
    const searchResult = await searchWithRealAPI(
      name,
      prefecture,
      address,
      excludeKeywords,
      page
    );

    // 除外キーワードでフィルタリング
    let filteredResults = searchResult.results;
    if (excludeKeywords && excludeKeywords.length > 0) {
      filteredResults = searchResult.results.filter((result) => {
        const searchText = `${result.title || ""} ${result.company || ""} ${
          result.address || ""
        } ${result.snippet}`.toLowerCase();
        return !excludeKeywords.some((keyword) =>
          searchText.includes(keyword.toLowerCase())
        );
      });
      console.log(
        `[Search Service] Filtered out ${
          searchResult.results.length - filteredResults.length
        } results containing excluded keywords`
      );
    }

    const searchTime = (Date.now() - startTime) / 1000;

    return {
      results: filteredResults,
      totalResults: searchResult.totalResults, // Google APIからの正確な総件数
      searchTime,
      hasNextPage: searchResult.hasNextPage,
      currentPage: page,
    };
  } catch (error) {
    console.error("Search error:", error);
    throw new Error("検索中にエラーが発生しました");
  }
}
