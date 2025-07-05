import { SearchResult } from "@/types/search";

interface GoogleSearchItem {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  pagemap?: {
    organization?: Array<{
      name?: string;
      address?: string;
      telephone?: string;
      url?: string;
    }>;
    person?: Array<{
      name?: string;
      jobtitle?: string;
      worksfor?: string;
      address?: string;
      telephone?: string;
      email?: string;
    }>;
  };
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[];
  searchInformation: {
    totalResults: string;
    searchTime: number;
  };
  queries?: {
    request?: Array<{
      title: string;
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
      inputEncoding: string;
      outputEncoding: string;
      safe: string;
      cx: string;
    }>;
    nextPage?: Array<{
      title: string;
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
      inputEncoding: string;
      outputEncoding: string;
      safe: string;
      cx: string;
    }>;
  };
}

function extractInfoFromItem(
  item: GoogleSearchItem,
  searchName: string
): SearchResult {
  const id = `google-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // ページマップから情報を抽出
  const organization = item.pagemap?.organization?.[0];
  const person = item.pagemap?.person?.[0];

  // タイトルと本文から会社名や役職を抽出する簡単なパターンマッチング
  // const titleLower = item.title.toLowerCase();
  // const snippetLower = item.snippet.toLowerCase();
  const fullText = `${item.title} ${item.snippet}`.toLowerCase();

  // 会社名パターン
  const companyPatterns = [
    /株式会社[^、。\s]+/g,
    /[^、。\s]+株式会社/g,
    /有限会社[^、。\s]+/g,
    /[^、。\s]+有限会社/g,
    /[^、。\s]+会社/g,
    /[^、。\s]+法人/g,
    /[^、。\s]+グループ/g,
    /[^、。\s]+コーポレーション/g,
  ];

  let extractedCompany = organization?.name || person?.worksfor;
  if (!extractedCompany) {
    for (const pattern of companyPatterns) {
      const matches = fullText.match(pattern);
      if (matches) {
        extractedCompany = matches[0];
        break;
      }
    }
  }

  // 役職パターン
  const positionPatterns = [
    /代表取締役[^、。\s]*/g,
    /取締役[^、。\s]*/g,
    /社長/g,
    /部長/g,
    /課長/g,
    /主任/g,
    /係長/g,
    /マネージャー/g,
    /ディレクター/g,
    /執行役員/g,
    /常務/g,
    /専務/g,
    /CTO|CEO|COO|CFO/gi,
  ];

  let extractedPosition = person?.jobtitle;
  if (!extractedPosition) {
    for (const pattern of positionPatterns) {
      const matches = fullText.match(pattern);
      if (matches) {
        extractedPosition = matches[0];
        break;
      }
    }
  }

  // 住所パターン
  const addressPatterns = [
    /[^、。\s]*[都道府県][^、。\s]*市[^、。\s]*/g,
    /東京都[^、。\s]*/g,
    /大阪府[^、。\s]*/g,
    /〒\d{3}-\d{4}[^、。\s]*/g,
  ];

  let extractedAddress = organization?.address || person?.address;
  if (!extractedAddress) {
    for (const pattern of addressPatterns) {
      const matches = fullText.match(pattern);
      if (matches) {
        extractedAddress = matches[0];
        break;
      }
    }
  }

  // 電話番号パターン
  const phonePattern = /\d{2,4}-\d{2,4}-\d{4}/g;
  let extractedPhone = organization?.telephone || person?.telephone;
  if (!extractedPhone) {
    const phoneMatches = fullText.match(phonePattern);
    if (phoneMatches) {
      extractedPhone = phoneMatches[0];
    }
  }

  // メールアドレスパターン
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  let extractedEmail = person?.email;
  if (!extractedEmail) {
    const emailMatches = fullText.match(emailPattern);
    if (emailMatches) {
      extractedEmail = emailMatches[0];
    }
  }

  return {
    id,
    name: searchName,
    title: item.title,
    company: extractedCompany,
    position: extractedPosition,
    address: extractedAddress,
    phone: extractedPhone,
    email: extractedEmail,
    website: item.link,
    source: item.displayLink,
    snippet: item.snippet,
  };
}

// ローカルストレージでAPI使用量を更新
function incrementApiCallsInLocalStorage() {
  if (typeof window === "undefined") return;

  try {
    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem("search-query-usage");

    let usage = {
      date: today,
      count: 0,
      apiCalls: 0,
    };

    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) {
        usage = parsed;
      }
    }

    usage.apiCalls += 1;
    localStorage.setItem("search-query-usage", JSON.stringify(usage));
  } catch (error) {
    console.error("Failed to update API usage:", error);
  }
}

async function performGoogleSearch(
  apiKey: string,
  searchEngineId: string,
  query: string,
  name: string,
  startIndex: number = 1
): Promise<{
  results: SearchResult[];
  totalResults: number;
  hasNextPage: boolean;
}> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodedQuery}&num=10&start=${startIndex}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Google Search API error: ${response.status} ${response.statusText}`
    );
  }

  const data: GoogleSearchResponse = await response.json();

  // API呼び出し回数をローカルストレージで更新
  incrementApiCallsInLocalStorage();

  if (!data.items || data.items.length === 0) {
    return {
      results: [],
      totalResults: 0,
      hasNextPage: false,
    };
  }

  const totalResults = parseInt(data.searchInformation.totalResults) || 0;
  const hasNextPage =
    !!data.queries?.nextPage && data.queries.nextPage.length > 0;

  console.log("GoogleSearchResponse", {
    itemsLength: data.items.length,
    totalResults,
    hasNextPage,
    currentStartIndex: startIndex,
  });

  return {
    results: data.items.map((item) => extractInfoFromItem(item, name)),
    totalResults,
    hasNextPage,
  };
}

export async function searchWithGoogle(
  name: string,
  prefecture?: string,
  address?: string,
  excludeKeywords?: string[],
  page: number = 0
): Promise<{
  results: SearchResult[];
  totalResults: number;
  hasNextPage: boolean;
  currentPage: number;
}> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    throw new Error(
      "Google Search APIキーまたは検索エンジンIDが設定されていません"
    );
  }

  // ローカルストレージで制限チェック
  if (typeof window !== "undefined") {
    try {
      const today = new Date().toISOString().split("T")[0];
      const stored = localStorage.getItem("search-query-usage");

      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === today && parsed.apiCalls >= 100) {
          console.warn("[Google Search] Daily API limit (100 calls) reached");
          return {
            results: [],
            totalResults: 0,
            hasNextPage: false,
            currentPage: page,
          };
        }
      }
    } catch (error) {
      console.error("Failed to check API usage:", error);
    }
  }

  // 複数の検索クエリを試行して結果を統合（完全一致のみ）
  let queries: string[] = [];

  // 除外キーワードを含むクエリ文字列を作成
  const excludeQuery =
    excludeKeywords && excludeKeywords.length > 0
      ? ` ${excludeKeywords.map((k) => `-"${k}"`).join(" ")}`
      : "";

  if (prefecture && address) {
    queries = [`"${name}" "${prefecture}" "${address}"${excludeQuery}`];
  } else if (prefecture) {
    queries = [`"${name}" "${prefecture}"${excludeQuery}`];
  } else if (address) {
    queries = [`"${name}" "${address}"${excludeQuery}`];
  } else {
    queries = [`"${name}"${excludeQuery}`];
  }

  const allResults: SearchResult[] = [];
  let totalResults = 0;
  let hasNextPage = false;

  try {
    // 複数のクエリで検索（単一ページのみ）
    for (const query of queries) {
      // ページネーション：10件ずつ取得
      const startIndex = page * 10 + 1;

      try {
        const searchResponse = await performGoogleSearch(
          apiKey,
          searchEngineId,
          query,
          name,
          startIndex
        );

        // API呼び出し回数はperformGoogleSearch内で更新される

        if (searchResponse.results.length > 0) {
          allResults.push(...searchResponse.results);
        }

        // 最初のクエリから総結果数とページ情報を取得
        if (totalResults === 0) {
          totalResults = searchResponse.totalResults;
          hasNextPage = searchResponse.hasNextPage;
        }

        // API制限を考慮して少し待機
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(
          `Google search failed for query "${query}" at page ${page}:`,
          error
        );
      }
    }

    console.log(
      `[Google Search] Searching for "${name}" with ${queries.length} queries:`,
      queries
    );

    // 重複を除去（URLが同じものを除外）
    const uniqueResults = allResults.filter(
      (result, index, self) =>
        index === self.findIndex((r) => r.website === result.website)
    );

    console.log(
      `[Google Search] Found ${allResults.length} total results, ${uniqueResults.length} unique results for "${name}"`
    );

    return {
      results: uniqueResults,
      totalResults,
      hasNextPage,
      currentPage: page,
    };
  } catch (error) {
    console.error("Google Search API error:", error);
    throw new Error("Google検索中にエラーが発生しました");
  }
}
