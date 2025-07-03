"use client";

import React, { useState, useTransition } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnterpriseSearchForm } from "@/components/enterprise-search-form";
import { EnterpriseResults } from "@/components/enterprise-results";
import { QueryUsageIndicator } from "@/components/query-usage-indicator";
import { EnterpriseSearchResult, EnterpriseSearchFormData } from "@/types/enterprise-search";
import { useQueryLimit } from "@/hooks/use-query-limit";
import { searchEnterpriseAction, checkVertexAIConfigAction } from "@/lib/actions/vertex-search-actions";

export default function EnterpriseSearchPage() {
  const [searchResults, setSearchResults] = useState<EnterpriseSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const { canQuery, incrementUsage } = useQueryLimit();

  // Vertex AI設定確認
  React.useEffect(() => {
    const checkConfig = async () => {
      try {
        const result = await checkVertexAIConfigAction();
        if (result.success && result.data) {
          setIsConfigured(result.data.isConfigured);
          if (!result.data.isConfigured) {
            console.warn('⚠️ Vertex AI Search not configured:', result.data.missingConfig);
          }
        }
      } catch (err) {
        console.error('Failed to check Vertex AI configuration:', err);
        setIsConfigured(false);
      }
    };
    
    checkConfig();
  }, []);

  const handleSearch = async (formData: EnterpriseSearchFormData) => {
    if (!canQuery) {
      setError('本日のクエリ制限（100回）に達しました。明日リセットされます。');
      return;
    }

    setError(null);
    
    startTransition(async () => {
      try {
        const canProceed = incrementUsage();
        if (!canProceed) {
          setError('クエリ制限に達しました。');
          return;
        }

        // Vertex AI Searchを使用（設定されている場合）
        if (isConfigured) {
          console.log('🚀 Using Vertex AI Search');
          const result = await searchEnterpriseAction(formData);
          
          if (result.success && result.data) {
            setSearchResults(result.data.results);
          } else {
            setError(result.error || '企業検索中にエラーが発生しました');
            setSearchResults([]);
          }
        } else {
          // フォールバック: モックデータを使用
          console.log('⚠️ Using mock data (Vertex AI not configured)');
          
          const mockResults: EnterpriseSearchResult[] = [
            {
              id: "mock-1",
              personName: formData.personName,
              personAddress: formData.personAddress,
              companyName: "株式会社サンプル（モックデータ）",
              position: "営業部長",
              companyPhone: "03-1234-5678",
              source: "モックデータ",
              confidence: 0.85,
              lastUpdated: new Date().toISOString(),
            },
            {
              id: "mock-2",
              personName: formData.personName,
              personAddress: formData.personAddress,
              companyName: "テストコーポレーション（モックデータ）",
              position: "取締役",
              companyPhone: "03-9876-5432",
              source: "モックデータ",
              confidence: 0.72,
              lastUpdated: new Date().toISOString(),
            }
          ];

          // 検索対象に基づいてフィルタリング
          const filteredResults = mockResults.map(result => ({
            ...result,
            companyName: formData.searchTargets.companyName ? result.companyName : "",
            companyPhone: formData.searchTargets.companyPhone ? result.companyPhone : "",
            position: formData.searchTargets.position ? result.position : "",
          }));

          setSearchResults(filteredResults);
        }

      } catch (err) {
        setError('検索中に予期しないエラーが発生しました');
        setSearchResults([]);
        console.error('Enterprise search error:', err);
      }
    });
  };

  const handleExport = (selectedResults: EnterpriseSearchResult[]) => {
    try {
      // TODO: 企業検索用のExcel出力機能を実装
      console.log('Exporting enterprise results:', selectedResults);
      
      // 仮のエクスポート処理
      const csvContent = selectedResults.map(result => 
        `${result.personName},${result.personAddress},${result.companyName},${result.companyPhone || ''},${result.position || ''},${result.confidence},${result.source}`
      ).join('\n');
      
      const blob = new Blob([`氏名,住所,会社名,会社電話番号,役職,信頼度,ソース\n${csvContent}`], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enterprise-search-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エクスポート中にエラーが発生しました');
    }
  };

  return (
    <>
      {/* Query Usage Indicator */}
      <QueryUsageIndicator />

      {/* Configuration Status */}
      {isConfigured === false && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-yellow-800 font-medium mb-1">Vertex AI Search未設定</p>
                <p className="text-yellow-700 text-sm">
                  Vertex AI Searchが設定されていないため、<strong>モックデータ</strong>を表示します。
                  本格運用には<code>.env.local</code>ファイルでの設定が必要です。
                  詳細は<code>VERTEX_AI_SETUP.md</code>を参照してください。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isConfigured === true && (
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-green-800 font-medium mb-1">Vertex AI Search有効</p>
                <p className="text-green-700 text-sm">
                  <strong>Vertex AI Search</strong>が正常に設定されており、高精度な企業情報検索が利用可能です。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Notice */}
      <Card className="mb-8 border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-blue-800 font-medium mb-1">企業検索機能について</p>
              <p className="text-blue-700 text-sm">
                この機能は<strong>Vertex AI Search</strong>を使用して、氏名と住所から会社名、会社電話番号、役職を高精度で取得します。
                {isConfigured === false && "現在は設定が未完了のため、サンプルデータを表示しています。"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Form */}
      <EnterpriseSearchForm onSearch={handleSearch} isLoading={isPending} />

      {/* Error Message */}
      {error && (
        <Card className="mb-8 border-destructive bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isPending && (
        <Card className="mb-8">
          <CardContent className="py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">企業情報を検索中...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && !isPending && (
        <div className="mb-8">
          <EnterpriseResults results={searchResults} onExport={handleExport} />
        </div>
      )}

      {/* Instructions */}
      {searchResults.length === 0 && !isPending && (
        <Card>
          <CardHeader>
            <CardTitle>企業検索の使い方</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>上記のフォームに検索したい方の氏名と住所を入力してください</li>
              <li>検索精度を選択します（高精度推奨）</li>
              <li>取得したい情報のタイプ（会社名、会社電話番号、役職）を選択してください</li>
              <li>「企業検索を実行」ボタンをクリックして検索を開始します</li>
              <li>検索結果が表示されたら、必要な情報にチェックを入れてください</li>
              <li>「選択した項目をエクスポート」ボタンでCSV形式でダウンロードします</li>
            </ol>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                <strong>注意:</strong> この機能を使用するには、Google CloudのVertex AI Searchの設定が必要です。
                詳細は管理者にお問い合わせください。
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}