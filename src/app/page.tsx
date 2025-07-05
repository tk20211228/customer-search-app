"use client";

import { useState, useTransition, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfiniteSearchResults } from "@/components/infinite-search-results";
import { SearchResult } from "@/types/search";
import { exportToExcel } from "@/lib/excel-export";
import { useQueryLimit } from "@/hooks/use-query-limit";

export default function Home() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [excludeEnabled, setExcludeEnabled] = useState(false);
  const [excludeInput, setExcludeInput] = useState("");
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchParams, setSearchParams] = useState<{
    name: string;
    address?: string;
    excludeKeywords?: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { canQuery, canUseApi, incrementUsage } = useQueryLimit();

  // 除外キーワード入力を解析する関数
  const parseExcludeKeywords = (input: string): string[] => {
    return input
      .split(/[,、]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const handleExcludeEnabledChange = (checked: boolean) => {
    setExcludeEnabled(checked);
    if (checked && !excludeInput.trim()) {
      setExcludeInput("東京都,");
    }
  };

  const handleExcludeInputChange = (value: string) => {
    setExcludeInput(value);
    if (excludeEnabled) {
      setExcludeKeywords(parseExcludeKeywords(value));
    } else {
      setExcludeKeywords([]);
    }
  };

  // 除外機能の有効/無効が変更された時の処理
  useEffect(() => {
    if (excludeEnabled) {
      setExcludeKeywords(parseExcludeKeywords(excludeInput));
    } else {
      setExcludeKeywords([]);
    }
  }, [excludeEnabled, excludeInput]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // クエリ制限チェック
    if (!canQuery) {
      setError("本日のクエリ制限（100回）に達しました。明日リセットされます。");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        // クエリ使用量を増加
        const canProceed = incrementUsage();
        if (!canProceed) {
          setError("クエリ制限に達しました。");
          return;
        }

        // 検索パラメータを設定
        setSearchParams({
          name: name.trim(),
          address: address.trim() || undefined,
          excludeKeywords:
            excludeKeywords.length > 0 ? excludeKeywords : undefined,
        });
        setHasSearched(true);
      } catch (err) {
        setError("検索中に予期しないエラーが発生しました");
        console.error("Search error:", err);
      }
    });
  };

  const handleExport = (selectedResults: SearchResult[]) => {
    try {
      const result = exportToExcel(selectedResults);
      console.log(
        `Exported ${result.recordCount} records to ${result.filename}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "エクスポート中にエラーが発生しました"
      );
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              顧客名簿検索アプリ
            </h1>
            <p className="text-muted-foreground text-lg">
              氏名から会社名・勤務先住所を検索してExcel出力
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                検索項目
              </CardTitle>
              <CardDescription>
                検索したい方の情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-6">
                {/* 1段目: 氏名 */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    氏名 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="例: 田中太郎"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full"
                    required
                  />
                </div>

                {/* 2段目: 住所 */}
                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium">
                    住所{" "}
                    <span className="text-muted-foreground text-xs">
                      （任意）
                    </span>
                  </label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="例: 東京都渋谷区渋谷1-2-3 ○○ビル 5F"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* 3段目: 除外設定と検索ボタン */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-2 flex-1">
                    <Checkbox
                      id="exclude-enabled"
                      checked={excludeEnabled}
                      onCheckedChange={handleExcludeEnabledChange}
                    />
                    <Input
                      placeholder="例: 東京都, 大阪府など複数キーワードを検索から除外"
                      value={excludeInput}
                      onChange={(e) => handleExcludeInputChange(e.target.value)}
                      disabled={!excludeEnabled}
                      className="flex-1"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={
                      isPending || !name.trim() || !canQuery || !canUseApi
                    }
                    size="lg"
                    className="px-8 shrink-0"
                  >
                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        検索中...
                      </div>
                    ) : canQuery && canUseApi ? (
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        検索実行
                      </div>
                    ) : (
                      "制限達成"
                    )}
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
          {hasSearched && searchParams && (
            <div className="mb-8">
              <InfiniteSearchResults
                searchParams={searchParams}
                onExport={handleExport}
              />
            </div>
          )}

          {/* Instructions */}
          {!hasSearched && (
            <Card>
              <CardHeader>
                <CardTitle>使い方</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>上記のフォームに検索したい方の氏名を入力してください</li>
                  <li>検索ボタンをクリックして検索を実行します</li>
                  <li>
                    検索結果が表示されたら、必要な情報にチェックを入れてください
                  </li>
                  <li>
                    エクスポートボタンをクリックしてExcel形式でダウンロードします
                  </li>
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
