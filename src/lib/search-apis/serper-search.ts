import { SearchResult } from "@/types/search";

interface SerperSearchResult {
  title: string;
  link: string;
  snippet: string;
  domain: string;
}

interface SerperResponse {
  organic: SerperSearchResult[];
  searchParameters: {
    q: string;
  };
}

function extractInfoFromSerperResult(
  result: SerperSearchResult,
  searchName: string
): SearchResult {
  const id = `serper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const fullText = `${result.title} ${result.snippet}`.toLowerCase();

  // 会社名抽出パターン
  const companyPatterns = [
    /株式会社[^、。\s]+/g,
    /[^、。\s]+株式会社/g,
    /有限会社[^、。\s]+/g,
    /[^、。\s]+有限会社/g,
    /[^、。\s]+会社/g,
    /[^、。\s]+法人/g,
    /[^、。\s]+グループ/g,
    /[^、。\s]+コーポレーション/g,
    /[^、。\s]+企業/g,
  ];

  let extractedCompany: string | undefined;
  for (const pattern of companyPatterns) {
    const matches = fullText.match(pattern);
    if (matches) {
      extractedCompany = matches[0];
      break;
    }
  }

  // 役職抽出パターン
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

  let extractedPosition: string | undefined;
  for (const pattern of positionPatterns) {
    const matches = fullText.match(pattern);
    if (matches) {
      extractedPosition = matches[0];
      break;
    }
  }

  // 住所抽出パターン
  const addressPatterns = [
    /[^、。\s]*[都道府県][^、。\s]*市[^、。\s]*/g,
    /東京都[^、。\s]*/g,
    /大阪府[^、。\s]*/g,
    /〒\d{3}-\d{4}[^、。\s]*/g,
  ];

  let extractedAddress: string | undefined;
  for (const pattern of addressPatterns) {
    const matches = fullText.match(pattern);
    if (matches) {
      extractedAddress = matches[0];
      break;
    }
  }

  // 電話番号抽出
  const phonePattern = /\d{2,4}-\d{2,4}-\d{4}/g;
  const phoneMatches = fullText.match(phonePattern);
  const extractedPhone = phoneMatches?.[0];

  // メールアドレス抽出
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = fullText.match(emailPattern);
  const extractedEmail = emailMatches?.[0];

  return {
    id,
    name: searchName,
    title: result.title,
    company: extractedCompany,
    position: extractedPosition,
    address: extractedAddress,
    phone: extractedPhone,
    email: extractedEmail,
    website: result.link,
    source: result.domain,
    snippet: result.snippet,
  };
}

async function performSerperSearch(
  apiKey: string,
  query: string,
  name: string
): Promise<SearchResult[]> {
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      gl: "jp",
      hl: "ja",
      num: 10,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Serper API error: ${response.status} ${response.statusText}`
    );
  }

  const data: SerperResponse = await response.json();

  console.log("SerperResponse", data);

  if (!data.organic || data.organic.length === 0) {
    return [];
  }

  return data.organic.map((result) =>
    extractInfoFromSerperResult(result, name)
  );
}

export async function searchWithSerper(
  name: string,
  prefecture?: string,
  address?: string,
  excludeKeywords?: string[]
): Promise<SearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    throw new Error("Serper APIキーが設定されていません");
  }

  // 複数の検索クエリを試行（完全一致のみ）
  let queries: string[] = [];

  // 除外キーワードを含むクエリ文字列を作成
  const excludeQuery = excludeKeywords && excludeKeywords.length > 0 
    ? ` ${excludeKeywords.map(k => `-"${k}"`).join(' ')}`
    : '';

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

  try {
    console.log(
      `[Serper Search] Searching for "${name}" with ${queries.length} queries:`,
      queries
    );

    // 複数のクエリで検索（順次実行でAPI制限に配慮）
    for (const query of queries) {
      try {
        const results = await performSerperSearch(apiKey, query, name);
        allResults.push(...results);

        // 少し待機してAPI制限を避ける
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Serper search failed for query "${query}":`, error);
      }
    }

    // 重複を除去（URLが同じものを除外）
    const uniqueResults = allResults.filter(
      (result, index, self) =>
        index === self.findIndex((r) => r.website === result.website)
    );

    console.log(
      `[Serper Search] Found ${allResults.length} total results, ${uniqueResults.length} unique results for "${name}"`
    );

    return uniqueResults.slice(0, 10); // 最大10件
  } catch (error) {
    console.error("Serper API error:", error);
    throw new Error("Serper検索中にエラーが発生しました");
  }
}
