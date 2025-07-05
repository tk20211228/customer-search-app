"use client";

import { useState, useCallback } from "react";
import {
  Download,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchResult } from "@/types/search";
import { InView } from "react-intersection-observer";
import useSWRInfinite from "swr/infinite";
import { searchPersonActionPaginated } from "@/lib/actions/search-actions";
import { QueryUsageContent } from "@/components/query-usage-content";
import { useQueryLimit } from "@/hooks/use-query-limit";

interface InfiniteSearchResultsProps {
  searchParams: {
    name: string;
    address?: string;
    excludeKeywords?: string[];
  };
  onExport: (selectedResults: SearchResult[]) => void;
}

export function InfiniteSearchResults({
  searchParams,
  onExport,
}: InfiniteSearchResultsProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { incrementUsage } = useQueryLimit();

  const getKey = useCallback(
    (pageIndex: number, previousPageData: { hasMore: boolean } | null) => {
      if (previousPageData && !previousPageData.hasMore) {
        return null; // 最後のページに到達
      }
      return {
        ...searchParams,
        page: pageIndex,
      };
    },
    [searchParams]
  );

  const fetcher = useCallback(
    async (params: {
      name: string;
      address?: string;
      excludeKeywords?: string[];
      page: number;
    }) => {
      // 1秒の遅延を追加（参考コードと同様）
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return await searchPersonActionPaginated(
        params.name,
        params.address,
        params.excludeKeywords,
        params.page,
        10 // limit
      );
    },
    []
  );

  const { data, isValidating, size, setSize } = useSWRInfinite(
    getKey,
    fetcher,
    {
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateFirstPage: false,
    }
  );

  const results = data?.map((page) => page.results).flat() || [];
  const isLast =
    data && data[data.length - 1] && !data[data.length - 1].hasMore;
  const totalCount = data?.[0]?.totalCount || 0;
  const actualTotalCount = totalCount; // Google APIからの正確な総件数

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(results.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectResult = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExport = () => {
    const selectedResults = results.filter((r) => selectedIds.has(r.id));
    onExport(selectedResults);
  };

  const allSelected = results.length > 0 && selectedIds.size === results.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < results.length;

  // 初回検索時のローディング表示
  if (!data && isValidating) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">検索中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // データが存在しない場合は何も表示しない
  if (!data || results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <Card className="sticky top-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              検索結果 ({results.length}件
              {actualTotalCount > results.length
                ? ` / 全${actualTotalCount.toLocaleString()}件`
                : ""}
              )
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  {someSelected && !allSelected && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-2 h-0.5 bg-primary rounded"></div>
                    </div>
                  )}
                </div>
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  すべて選択
                </label>
              </div>
              <Button
                onClick={handleExport}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                エクスポート ({selectedIds.size})
              </Button>
            </div>
          </div>

          {/* Query Usage Content */}
          <div className="mt-4 pt-4 border-t border-border">
            <QueryUsageContent />
          </div>
        </CardHeader>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {results.map((result) => (
          <Card key={result.id} className="transition-all hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Checkbox
                  id={`result-${result.id}`}
                  checked={selectedIds.has(result.id)}
                  onCheckedChange={(checked) =>
                    handleSelectResult(result.id, checked as boolean)
                  }
                  className="mt-1"
                />
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{result.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.snippet}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">会社名:</span>
                        <span>{result.company}</span>
                      </div>
                    )}

                    {result.position && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">役職:</span>
                        <span>{result.position}</span>
                      </div>
                    )}

                    {result.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">住所:</span>
                        <span>{result.address}</span>
                      </div>
                    )}

                    {result.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">電話:</span>
                        <span>{result.phone}</span>
                      </div>
                    )}

                    {result.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Email:</span>
                        <span>{result.email}</span>
                      </div>
                    )}

                    {result.website && (
                      <div className="flex items-center gap-2 text-sm md:col-span-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Website:</span>
                        <a
                          href={result.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate"
                        >
                          {result.title
                            ? `${result.title} (${
                                new URL(result.website).hostname
                              })`
                            : result.website}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    出典: {result.source}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading indicator */}
      {isValidating && (
        <Loader2
          size={40}
          className="animate-spin text-muted-foreground my-10 mx-auto"
        />
      )}

      {/* Infinite scroll trigger */}
      {!isValidating && !isLast && (
        <InView
          onChange={(inView) => {
            if (inView) {
              console.log("Loading page", size);
              // スクロールでローディングが起動したらカウント
              incrementUsage();
              setSize(size + 1);
            }
          }}
        />
      )}

      {/* End message */}
      {isLast && (
        <p className="text-muted-foreground text-sm my-10 text-center">
          すべての結果を表示しました ({results.length}件 / 全
          {actualTotalCount.toLocaleString()}件)
        </p>
      )}
    </div>
  );
}
