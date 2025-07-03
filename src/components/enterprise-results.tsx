"use client";

import { useState, useEffect } from "react";
import { Download, Building2, Phone, User, MapPin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { EnterpriseSearchResult } from "@/types/enterprise-search";

interface EnterpriseResultsProps {
  results: EnterpriseSearchResult[];
  onExport: (selectedResults: EnterpriseSearchResult[]) => void;
}

export function EnterpriseResults({ results, onExport }: EnterpriseResultsProps) {
  const [selectedResults, setSelectedResults] = useState<string[]>([]);

  useEffect(() => {
    setSelectedResults([]);
  }, [results]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedResults(results.map(result => result.id));
    } else {
      setSelectedResults([]);
    }
  };

  const handleSelectResult = (resultId: string, checked: boolean) => {
    if (checked) {
      setSelectedResults(prev => [...prev, resultId]);
    } else {
      setSelectedResults(prev => prev.filter(id => id !== resultId));
    }
  };

  const handleExport = () => {
    const selected = results.filter(result => selectedResults.includes(result.id));
    onExport(selected);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "高信頼度";
    if (confidence >= 0.6) return "中信頼度";
    return "低信頼度";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              企業検索結果 ({results.length}件)
            </CardTitle>
            <CardDescription>
              Vertex AI Searchによる企業情報検索結果
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedResults.length === results.length && results.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                全選択
              </label>
            </div>
            <Button
              onClick={handleExport}
              disabled={selectedResults.length === 0}
              size="sm"
              className="ml-2"
            >
              <Download className="h-4 w-4 mr-2" />
              選択した項目をエクスポート ({selectedResults.length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map((result) => (
            <Card key={result.id} className="relative">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    id={`result-${result.id}`}
                    checked={selectedResults.includes(result.id)}
                    onCheckedChange={(checked) => handleSelectResult(result.id, !!checked)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-3">
                    {/* 氏名・住所・会社名 */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-lg">{result.personName}</span>
                      </div>
                      {result.personAddress && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-600">{result.personAddress}</span>
                        </div>
                      )}
                      {result.companyName && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-base">{result.companyName}</span>
                        </div>
                      )}
                    </div>

                    {/* 詳細情報 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {result.position && (
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-purple-600" />
                          <span>役職: {result.position}</span>
                        </div>
                      )}
                      {result.companyPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-blue-600" />
                          <span>会社電話: {result.companyPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* 信頼度とソース情報 */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">信頼度:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={result.confidence * 100} className="w-16 h-2" />
                            <span className={`text-xs font-medium ${getConfidenceColor(result.confidence)}`}>
                              {getConfidenceLabel(result.confidence)} ({Math.round(result.confidence * 100)}%)
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ソース: {result.source}
                        </div>
                      </div>
                      {result.lastUpdated && (
                        <div className="text-xs text-muted-foreground">
                          更新: {new Date(result.lastUpdated).toLocaleDateString('ja-JP')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            検索結果がありません
          </div>
        )}
      </CardContent>
    </Card>
  );
}