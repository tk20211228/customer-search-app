"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchResults } from "@/components/search-results";
import { QueryUsageIndicator } from "@/components/query-usage-indicator";
import { SearchResult } from "@/types/search";
import { searchPersonAction } from "@/lib/actions/search-actions";
import { exportToExcel } from "@/lib/excel-export";
import { useQueryLimit } from "@/hooks/use-query-limit";

export default function Home() {
  const [name, setName] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { canQuery, incrementUsage } = useQueryLimit();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // クエリ制限チェック
    if (!canQuery) {
      setError('本日のクエリ制限（100回）に達しました。明日リセットされます。');
      return;
    }

    setError(null);
    
    startTransition(async () => {
      try {
        // クエリ使用量を増加
        const canProceed = incrementUsage();
        if (!canProceed) {
          setError('クエリ制限に達しました。');
          return;
        }

        const result = await searchPersonAction(name.trim());
        
        if (result.success && result.data) {
          setSearchResults(result.data.results);
        } else {
          setError(result.error || '検索中にエラーが発生しました');
          setSearchResults([]);
        }
      } catch (err) {
        setError('検索中に予期しないエラーが発生しました');
        setSearchResults([]);
        console.error('Search error:', err);
      }
    });
  };

  const handleExport = (selectedResults: SearchResult[]) => {
    try {
      const result = exportToExcel(selectedResults);
      console.log(`Exported ${result.recordCount} records to ${result.filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エクスポート中にエラーが発生しました');
    }
  };

  return (
    <>
      {/* Query Usage Indicator */}
      <QueryUsageIndicator />

      {/* Search Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            氏名検索（基本検索）
          </CardTitle>
          <CardDescription>
            検索したい方の氏名を入力してください（Google検索ベース）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="例: 田中太郎"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" disabled={isPending || !name.trim() || !canQuery}>
                {isPending ? "検索中..." : canQuery ? "検索" : "制限達成"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="mb-8 border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isPending && (
        <Card className="mb-8">
          <CardContent className="py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">検索中...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && !isPending && (
        <div className="mb-8">
          <SearchResults results={searchResults} onExport={handleExport} />
        </div>
      )}

      {/* Instructions */}
      {searchResults.length === 0 && !isPending && (
        <Card>
          <CardHeader>
            <CardTitle>使い方</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>上記のフォームに検索したい方の氏名を入力してください</li>
              <li>検索ボタンをクリックして検索を実行します</li>
              <li>検索結果が表示されたら、必要な情報にチェックを入れてください</li>
              <li>エクスポートボタンをクリックしてExcel形式でダウンロードします</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </>
  );
}