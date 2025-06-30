import { SearchResult } from "@/types/search";

// interface DuckDuckGoResult {
//   title: string;
//   href: string;
//   body: string;
// }

// function extractInfoFromDuckDuckGoResult(result: DuckDuckGoResult, searchName: string): SearchResult {
//   const id = `ddg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

//   const fullText = `${result.title} ${result.body}`.toLowerCase();

//   // 会社名抽出パターン
//   const companyPatterns = [
//     /株式会社[^、。\s]+/g,
//     /[^、。\s]+株式会社/g,
//     /有限会社[^、。\s]+/g,
//     /[^、。\s]+有限会社/g,
//     /[^、。\s]+会社/g,
//     /[^、。\s]+法人/g,
//     /[^、。\s]+グループ/g,
//     /[^、。\s]+コーポレーション/g,
//     /[^、。\s]+企業/g,
//   ];

//   let extractedCompany: string | undefined;
//   for (const pattern of companyPatterns) {
//     const matches = fullText.match(pattern);
//     if (matches) {
//       extractedCompany = matches[0];
//       break;
//     }
//   }

//   // 役職抽出パターン
//   const positionPatterns = [
//     /代表取締役[^、。\s]*/g,
//     /取締役[^、。\s]*/g,
//     /社長/g,
//     /部長/g,
//     /課長/g,
//     /主任/g,
//     /係長/g,
//     /マネージャー/g,
//     /ディレクター/g,
//     /執行役員/g,
//     /常務/g,
//     /専務/g,
//     /CTO|CEO|COO|CFO/gi,
//   ];

//   let extractedPosition: string | undefined;
//   for (const pattern of positionPatterns) {
//     const matches = fullText.match(pattern);
//     if (matches) {
//       extractedPosition = matches[0];
//       break;
//     }
//   }

//   // 住所抽出パターン
//   const addressPatterns = [
//     /[^、。\s]*[都道府県][^、。\s]*市[^、。\s]*/g,
//     /東京都[^、。\s]*/g,
//     /大阪府[^、。\s]*/g,
//     /〒\d{3}-\d{4}[^、。\s]*/g,
//   ];

//   let extractedAddress: string | undefined;
//   for (const pattern of addressPatterns) {
//     const matches = fullText.match(pattern);
//     if (matches) {
//       extractedAddress = matches[0];
//       break;
//     }
//   }

//   // 電話番号抽出
//   const phonePattern = /\d{2,4}-\d{2,4}-\d{4}/g;
//   const phoneMatches = fullText.match(phonePattern);
//   const extractedPhone = phoneMatches?.[0];

//   // メールアドレス抽出
//   const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
//   const emailMatches = fullText.match(emailPattern);
//   const extractedEmail = emailMatches?.[0];

//   // ドメイン抽出
//   let domain: string;
//   try {
//     domain = new URL(result.href).hostname;
//   } catch {
//     domain = result.href;
//   }

//   return {
//     id,
//     name: searchName,
//     company: extractedCompany,
//     position: extractedPosition,
//     address: extractedAddress,
//     phone: extractedPhone,
//     email: extractedEmail,
//     website: result.href,
//     source: domain,
//     snippet: result.body,
//   };
// }

export async function searchWithDuckDuckGo(
  name: string
): Promise<SearchResult[]> {
  const query = encodeURIComponent(`"${name}" 会社 勤務先 役職`);

  try {
    // DuckDuckGo Instant Answer APIを使用（制限あり）
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${query}&format=json&no_redirect=1&no_html=1&skip_disambig=1`
    );

    if (!response.ok) {
      throw new Error(
        `DuckDuckGo API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // DuckDuckGo APIは制限が多いため、基本的な情報のみ返す
    if (data.AbstractText) {
      return [
        {
          id: `ddg-${Date.now()}`,
          name: name,
          company: undefined,
          position: undefined,
          address: undefined,
          phone: undefined,
          email: undefined,
          website: data.AbstractURL,
          source: "duckduckgo.com",
          snippet: data.AbstractText,
        },
      ];
    }

    return [];
  } catch (error) {
    console.error("DuckDuckGo API error:", error);
    throw new Error("DuckDuckGo検索中にエラーが発生しました");
  }
}
