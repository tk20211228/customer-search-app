"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useQueryLimit } from "@/hooks/use-query-limit";

export function QueryUsageIndicator() {
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

  // const getProgressColor = () => {
  //   if (usagePercentage >= 90) return "bg-red-500";
  //   if (usagePercentage >= 70) return "bg-yellow-500";
  //   return "bg-green-500";
  // };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>今日のクエリ使用量</span>
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={resetUsage}
            className="h-6 w-6 p-0"
            title="使用量をリセット（開発用）"
          >
            <RotateCcw className="h-3 w-3" />
          </Button> */}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className={getStatusColor()}>
            {usedQueries} / {totalQueries} クエリ使用済み
          </span>
          <span className="text-muted-foreground">
            残り {remainingQueries} 回
          </span>
        </div>

        <Progress value={usagePercentage} className="h-2" />

        {!canQuery && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            <AlertTriangle className="h-4 w-4" />
            <span>本日のクエリ制限に達しました。明日リセットされます。</span>
          </div>
        )}

        {usagePercentage >= 80 && canQuery && (
          <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
            <AlertTriangle className="h-4 w-4" />
            <span>クエリ制限の80%に達しています。ご注意ください。</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
