"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink, Search, Save } from "lucide-react";
import { SearchRecord, Customer } from "@/types/customer";
import { SearchResult } from "@/types/search";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { searchGoogle } from "@/lib/actions/search-actions";

interface SearchTabsProps {
  customer: Customer;
  searchRecords: SearchRecord[];
  onUpdate: () => void;
}

type SearchSource = "google" | "facebook" | "linkedin" | "eight";

export function SearchTabs({
  customer,
  searchRecords,
  onUpdate,
}: SearchTabsProps) {
  const [activeTab, setActiveTab] = useState<SearchSource>("google");
  const [loading, setLoading] = useState(false);
  const [googleSearchResults, setGoogleSearchResults] = useState<
    SearchResult[]
  >([]);

  const handleGoogleSearch = async () => {
    setLoading(true);
    try {
      const query = `${customer.owner_name} ${customer.owner_address || ""}`;
      const result = await searchGoogle(query);

      if (result.success && result.data) {
        setGoogleSearchResults(result.data.results);
        toast.success("検索が完了しました");
      } else {
        toast.error("検索に失敗しました");
      }
    } catch (error) {
      console.error("Google search error:", error);
      toast.error("検索中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecord = async (
    source: SearchSource,
    candidateNumber: 1 | 2 | 3,
    data: Partial<SearchRecord>
  ) => {
    try {
      const existingRecord = searchRecords.find(
        (r) =>
          r.search_source === source && r.candidate_number === candidateNumber
      );

      if (existingRecord) {
        // 更新
        const { error } = await supabase
          .from("search_records")
          .update(data)
          .eq("id", existingRecord.id);

        if (error) throw error;
      } else {
        // 新規作成
        const { error } = await supabase.from("search_records").insert({
          customer_id: customer.id,
          search_source: source,
          candidate_number: candidateNumber,
          ...data,
        });

        if (error) throw error;
      }

      // 顧客のステータスを更新
      await supabase
        .from("customers")
        .update({
          search_status: "in_progress",
          last_searched_at: new Date().toISOString(),
        })
        .eq("id", customer.id);

      toast.success("保存しました");
      onUpdate();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("保存に失敗しました");
    }
  };

  const openExternalLink = (source: SearchSource) => {
    let url = "";
    const name = encodeURIComponent(customer.owner_name);

    switch (source) {
      case "facebook":
        url = `https://www.facebook.com/search/top?q=${name}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/search/results/people/?keywords=${name}`;
        break;
      case "eight":
        url = "https://8card.net/myhome?page=1&sort=exchangeDate&tab=network";
        // 名前をクリップボードにコピー
        navigator.clipboard.writeText(customer.owner_name);
        toast.success("名前をクリップボードにコピーしました");
        break;
    }

    if (url) {
      window.open(url, "_blank");
    }
  };

  const renderCandidateForm = (
    source: SearchSource,
    candidateNumber: 1 | 2 | 3
  ) => {
    const record = searchRecords.find(
      (r) =>
        r.search_source === source && r.candidate_number === candidateNumber
    );

    return (
      <Card key={candidateNumber}>
        <CardHeader>
          <CardTitle className="text-base">候補 {candidateNumber}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>会社名 *</Label>
              <Input
                id={`${source}-${candidateNumber}-company`}
                defaultValue={record?.company_name || ""}
                placeholder="株式会社〇〇"
              />
            </div>
            <div>
              <Label>役職 *</Label>
              <Input
                id={`${source}-${candidateNumber}-position`}
                defaultValue={record?.position || ""}
                placeholder="営業部長"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>部署</Label>
              <Input
                id={`${source}-${candidateNumber}-department`}
                defaultValue={record?.department || ""}
                placeholder="営業部"
              />
            </div>
            <div>
              <Label>会社電話番号</Label>
              <Input
                id={`${source}-${candidateNumber}-phone`}
                defaultValue={record?.company_phone || ""}
                placeholder="03-1234-5678"
              />
            </div>
          </div>

          <div>
            <Label>会社住所</Label>
            <Input
              id={`${source}-${candidateNumber}-address`}
              defaultValue={record?.company_address || ""}
              placeholder="東京都港区〇〇1-2-3"
            />
          </div>

          <div>
            <Label>出典URL *</Label>
            <Input
              id={`${source}-${candidateNumber}-url`}
              defaultValue={record?.source_url || ""}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>メールアドレス</Label>
              <Input
                id={`${source}-${candidateNumber}-email`}
                defaultValue={record?.email || ""}
                placeholder="example@company.com"
              />
            </div>
            <div>
              <Label>信頼度</Label>
              <Select
                defaultValue={record?.confidence_score?.toString() || "3"}
              >
                <SelectTrigger id={`${source}-${candidateNumber}-confidence`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - 低</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3 - 中</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5 - 高</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>メモ</Label>
            <Textarea
              id={`${source}-${candidateNumber}-notes`}
              defaultValue={record?.notes || ""}
              placeholder="追加情報があれば記入"
              rows={2}
            />
          </div>

          <Button
            onClick={() => {
              const data: Partial<SearchRecord> = {
                company_name: (
                  document.getElementById(
                    `${source}-${candidateNumber}-company`
                  ) as HTMLInputElement
                ).value,
                position: (
                  document.getElementById(
                    `${source}-${candidateNumber}-position`
                  ) as HTMLInputElement
                ).value,
                department: (
                  document.getElementById(
                    `${source}-${candidateNumber}-department`
                  ) as HTMLInputElement
                ).value,
                company_phone: (
                  document.getElementById(
                    `${source}-${candidateNumber}-phone`
                  ) as HTMLInputElement
                ).value,
                company_address: (
                  document.getElementById(
                    `${source}-${candidateNumber}-address`
                  ) as HTMLInputElement
                ).value,
                source_url: (
                  document.getElementById(
                    `${source}-${candidateNumber}-url`
                  ) as HTMLInputElement
                ).value,
                email: (
                  document.getElementById(
                    `${source}-${candidateNumber}-email`
                  ) as HTMLInputElement
                ).value,
                confidence_score: parseInt(
                  (
                    document.getElementById(
                      `${source}-${candidateNumber}-confidence`
                    ) as HTMLSelectElement
                  ).textContent || "3"
                ) as 1 | 2 | 3 | 4 | 5,
                notes: (
                  document.getElementById(
                    `${source}-${candidateNumber}-notes`
                  ) as HTMLTextAreaElement
                ).value,
              };
              handleSaveRecord(source, candidateNumber, data);
            }}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as SearchSource)}
    >
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="google">Google検索</TabsTrigger>
        <TabsTrigger value="facebook">Facebook</TabsTrigger>
        <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
        <TabsTrigger value="eight">Eight</TabsTrigger>
      </TabsList>

      <TabsContent value="google" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Google検索</CardTitle>
            <CardDescription>名前と住所で検索して情報を収集</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={`${customer.owner_name} ${
                    customer.owner_address || ""
                  }`}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={handleGoogleSearch} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  検索
                </Button>
              </div>

              {googleSearchResults.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">検索結果:</p>
                  <div className="space-y-2">
                    {googleSearchResults.map((result, index) => (
                      <div key={index} className="text-sm">
                        <a
                          href={result.website || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {result.title || result.name}
                        </a>
                        <p className="text-gray-600 text-xs mt-1">
                          {result.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {[1, 2, 3].map((num) =>
            renderCandidateForm("google", num as 1 | 2 | 3)
          )}
        </div>
      </TabsContent>

      {(["facebook", "linkedin", "eight"] as const).map((source) => (
        <TabsContent key={source} value={source} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {source === "facebook"
                  ? "Facebook検索"
                  : source === "linkedin"
                  ? "LinkedIn検索"
                  : "Eight検索"}
              </CardTitle>
              <CardDescription>外部サイトで検索して情報を収集</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => openExternalLink(source)}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {source === "eight"
                  ? "Eightを開く（名前をコピー）"
                  : `${source === "facebook" ? "Facebook" : "LinkedIn"}で検索`}
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {[1, 2, 3].map((num) =>
              renderCandidateForm(source, num as 1 | 2 | 3)
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
