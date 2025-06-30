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

async function performGoogleSearch(
  apiKey: string,
  searchEngineId: string,
  query: string,
  name: string
): Promise<SearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodedQuery}&num=10`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Google Search API error: ${response.status} ${response.statusText}`
    );
  }

  const data: GoogleSearchResponse = await response.json();

  if (!data.items || data.items.length === 0) {
    return [];
  }

  return data.items.map((item) => extractInfoFromItem(item, name));
}

export async function searchWithGoogle(name: string): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    throw new Error(
      "Google Search APIキーまたは検索エンジンIDが設定されていません"
    );
  }

  // 複数の検索クエリを試行して結果を統合
  const queries = [
    `"${name}" 会社 勤務先`,
    `"${name}" 株式会社`,
    `"${name}" 代表取締役 OR 取締役 OR 社長 OR 部長`,
    `${name} 会社 役職`,
  ];

  const allResults: SearchResult[] = [];

  try {
    // 複数のクエリで検索（並行実行）
    const searchPromises = queries.map((query) =>
      performGoogleSearch(apiKey, searchEngineId, query, name).catch(
        (error) => {
          console.warn(`Google search failed for query "${query}":`, error);
          return [];
        }
      )
    );

    const resultsArrays = await Promise.all(searchPromises);

    // 結果を統合
    for (const results of resultsArrays) {
      allResults.push(...results);
    }

    // 重複を除去（URLが同じものを除外）
    const uniqueResults = allResults.filter(
      (result, index, self) =>
        index === self.findIndex((r) => r.website === result.website)
    );

    return uniqueResults.slice(0, 10); // 最大10件
  } catch (error) {
    console.error("Google Search API error:", error);
    throw new Error("Google検索中にエラーが発生しました");
  }
}
