"use client";

import useLocalStorageState from "use-local-storage-state";
import { useMemo } from "react";

interface QueryUsage {
  date: string;
  count: number;
  apiCalls: number;
}

const DAILY_QUERY_LIMIT = 100;

export function useQueryLimit() {
  const [queryUsage, setQueryUsage] = useLocalStorageState<QueryUsage>(
    "search-query-usage",
    {
      defaultValue: {
        date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
        count: 0,
        apiCalls: 0,
      },
    }
  );

  const today = new Date().toISOString().split("T")[0];

  // 日付が変わった場合はカウントをリセット
  const currentUsage = useMemo(() => {
    if (queryUsage.date !== today) {
      const resetUsage = { date: today, count: 0, apiCalls: 0 };
      setQueryUsage(resetUsage);
      return resetUsage;
    }
    
    // apiCallsフィールドが存在しない場合は追加
    if (typeof queryUsage.apiCalls === 'undefined') {
      const fixedUsage = { ...queryUsage, apiCalls: 0 };
      setQueryUsage(fixedUsage);
      return fixedUsage;
    }
    
    return queryUsage;
  }, [queryUsage, today, setQueryUsage]);

  const canQuery = currentUsage.count < DAILY_QUERY_LIMIT;
  const canUseApi = currentUsage.apiCalls < 100;
  const remainingQueries = Math.max(0, DAILY_QUERY_LIMIT - currentUsage.count);
  const usagePercentage = Math.round(
    (currentUsage.count / DAILY_QUERY_LIMIT) * 100
  );


  const incrementUsage = () => {
    if (canQuery) {
      setQueryUsage({
        date: today,
        count: currentUsage.count + 1,
        apiCalls: currentUsage.apiCalls,
      });
      return true;
    }
    return false;
  };

  const incrementApiCalls = (count: number = 1) => {
    setQueryUsage({
      date: today,
      count: currentUsage.count,
      apiCalls: currentUsage.apiCalls + count,
    });
  };

  const resetUsage = () => {
    setQueryUsage({
      date: today,
      count: 0,
      apiCalls: 0,
    });
  };

  return {
    canQuery,
    canUseApi,
    remainingQueries,
    usedQueries: currentUsage.count,
    totalQueries: DAILY_QUERY_LIMIT,
    usagePercentage,
    incrementUsage,
    incrementApiCalls,
    resetUsage,
    // API呼び出し回数の情報
    googleSearchCalls: currentUsage.apiCalls,
    canUseGoogleSearch: canUseApi,
  };
}
