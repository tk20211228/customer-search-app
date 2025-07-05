"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryUsageContent } from "@/components/query-usage-content";

export function QueryUsageIndicator() {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">
          今日のクエリ使用量
        </CardTitle>
      </CardHeader>
      <CardContent>
        <QueryUsageContent />
      </CardContent>
    </Card>
  );
}
