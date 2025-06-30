"use client";

import useLocalStorageState from "use-local-storage-state";
import { useMemo } from "react";

interface QueryUsage {
  date: string;
  count: number;
}

const DAILY_QUERY_LIMIT = 100;

export function useQueryLimit() {
  const [queryUsage, setQueryUsage] = useLocalStorageState<QueryUsage>(
    "search-query-usage",
    {
      defaultValue: {
        date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
        count: 0,
      },
    }
  );

  const today = new Date().toISOString().split("T")[0];

  // 日付が変わった場合はカウントをリセット
  const currentUsage = useMemo(() => {
    if (queryUsage.date !== today) {
      const resetUsage = { date: today, count: 0 };
      setQueryUsage(resetUsage);
      return resetUsage;
    }
    return queryUsage;
  }, [queryUsage, today, setQueryUsage]);

  const canQuery = currentUsage.count < DAILY_QUERY_LIMIT;
  const remainingQueries = Math.max(0, DAILY_QUERY_LIMIT - currentUsage.count);
  const usagePercentage = Math.round(
    (currentUsage.count / DAILY_QUERY_LIMIT) * 100
  );

  const incrementUsage = () => {
    if (canQuery) {
      setQueryUsage({
        date: today,
        count: currentUsage.count + 1,
      });
      return true;
    }
    return false;
  };

  const resetUsage = () => {
    setQueryUsage({
      date: today,
      count: 0,
    });
  };

  return {
    canQuery,
    remainingQueries,
    usedQueries: currentUsage.count,
    totalQueries: DAILY_QUERY_LIMIT,
    usagePercentage,
    incrementUsage,
    resetUsage,
  };
}
