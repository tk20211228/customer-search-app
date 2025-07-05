"use client";

import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";
import { useQueryLimit } from "@/hooks/use-query-limit";

export function QueryUsageContent() {
  const {
    canQuery,
    remainingQueries,
    usedQueries,
    totalQueries,
    usagePercentage,
  } = useQueryLimit();

  const getStatusColor = () => {
    if (usagePercentage >= 90) return "text-red-600";
    if (usagePercentage >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-3">
      {/* 検索実行回数 */}
      <div className="flex items-center justify-between text-sm">
        <span className={getStatusColor()}>
          {usedQueries} / {totalQueries} 検索実行済み
        </span>
        <span className="text-muted-foreground">
          残り {remainingQueries} 回
        </span>
      </div>

      <Progress value={usagePercentage} className="h-2" />

      {!canQuery && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <AlertTriangle className="h-4 w-4" />
          <span>本日の検索制限に達しました。明日リセットされます。</span>
        </div>
      )}

      {usagePercentage >= 80 && canQuery && (
        <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
          <AlertTriangle className="h-4 w-4" />
          <span>検索制限の80%に達しています。ご注意ください。</span>
        </div>
      )}
    </div>
  );
}