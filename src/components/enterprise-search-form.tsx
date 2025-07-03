"use client";

import { useState } from "react";
import { Building2, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { EnterpriseSearchFormData } from "@/types/enterprise-search";

interface EnterpriseSearchFormProps {
  onSearch: (formData: EnterpriseSearchFormData) => void;
  isLoading?: boolean;
}

export function EnterpriseSearchForm({ onSearch, isLoading = false }: EnterpriseSearchFormProps) {
  const [formData, setFormData] = useState<EnterpriseSearchFormData>({
    personName: "",
    personAddress: "",
    searchPrecision: "high",
    searchTargets: {
      companyName: true,
      companyPhone: true,
      position: true,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.personName.trim() || !formData.personAddress.trim()) return;
    onSearch(formData);
  };

  const handleTargetChange = (target: keyof typeof formData.searchTargets, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      searchTargets: {
        ...prev.searchTargets,
        [target]: checked,
      },
    }));
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          企業検索（Vertex AI Search）
        </CardTitle>
        <CardDescription>
          AI搭載の高精度検索で企業情報を取得します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 氏名入力 */}
          <div className="space-y-2">
            <Label htmlFor="personName">氏名（必須）</Label>
            <Input
              id="personName"
              type="text"
              placeholder="例: 田中太郎"
              value={formData.personName}
              onChange={(e) => setFormData(prev => ({ ...prev, personName: e.target.value }))}
              required
            />
          </div>

          {/* 住所入力 */}
          <div className="space-y-2">
            <Label htmlFor="personAddress">住所（必須）</Label>
            <Input
              id="personAddress"
              type="text"
              placeholder="例: 東京都渋谷区渋谷1-2-3"
              value={formData.personAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, personAddress: e.target.value }))}
              required
            />
          </div>

          {/* 検索精度 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">検索精度</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="high-precision"
                  name="searchPrecision"
                  value="high"
                  checked={formData.searchPrecision === "high"}
                  onChange={(e) => setFormData(prev => ({ ...prev, searchPrecision: e.target.value as "high" | "standard" }))}
                  className="w-4 h-4"
                />
                <Label htmlFor="high-precision" className="text-sm">
                  高精度（時間がかかる場合があります）
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="standard-precision"
                  name="searchPrecision"
                  value="standard"
                  checked={formData.searchPrecision === "standard"}
                  onChange={(e) => setFormData(prev => ({ ...prev, searchPrecision: e.target.value as "high" | "standard" }))}
                  className="w-4 h-4"
                />
                <Label htmlFor="standard-precision" className="text-sm">
                  標準
                </Label>
              </div>
            </div>
          </div>

          {/* 検索対象 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              取得する情報
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="companyName"
                  checked={formData.searchTargets.companyName}
                  onCheckedChange={(checked) => handleTargetChange("companyName", !!checked)}
                />
                <Label htmlFor="companyName" className="text-sm">
                  会社名
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="companyPhone"
                  checked={formData.searchTargets.companyPhone}
                  onCheckedChange={(checked) => handleTargetChange("companyPhone", !!checked)}
                />
                <Label htmlFor="companyPhone" className="text-sm">
                  会社電話番号
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="position"
                  checked={formData.searchTargets.position}
                  onCheckedChange={(checked) => handleTargetChange("position", !!checked)}
                />
                <Label htmlFor="position" className="text-sm">
                  役職
                </Label>
              </div>
            </div>
          </div>

          {/* 検索ボタン */}
          <Button 
            type="submit" 
            disabled={isLoading || !formData.personName.trim() || !formData.personAddress.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                検索中...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                企業検索を実行
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}