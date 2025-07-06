"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SearchTabs } from "../../components/search-tabs";
import { Property, Customer, SearchRecord } from "@/types/customer";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;
  const customerId = params.customerId as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [searchRecords, setSearchRecords] = useState<SearchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // 物件情報を取得
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single();

      if (propertyError) throw propertyError;
      setProperty(propertyData);

      // 顧客情報を取得
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // 検索記録を取得
      const { data: recordsData, error: recordsError } = await supabase
        .from("search_records")
        .select("*")
        .eq("customer_id", customerId)
        .order("search_source", { ascending: true })
        .order("candidate_number", { ascending: true });

      if (recordsError) throw recordsError;
      setSearchRecords(recordsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [propertyId, customerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleComplete = async () => {
    try {
      // 少なくとも1つの検索記録があるかチェック
      if (searchRecords.length === 0) {
        toast.error("検索結果を1つ以上保存してから完了にしてください");
        return;
      }

      // 顧客のステータスを完了に更新
      const { error } = await supabase
        .from("customers")
        .update({
          search_status: "completed",
          last_searched_at: new Date().toISOString(),
        })
        .eq("id", customerId);

      if (error) throw error;

      // 物件の完了数を更新
      if (property) {
        await supabase
          .from("properties")
          .update({
            completed_customers: property.completed_customers + 1,
          })
          .eq("id", propertyId);
      }

      toast.success("調査を完了しました");
      router.push(`/customer-management/${propertyId}`);
    } catch (error) {
      console.error("Error completing search:", error);
      toast.error("完了処理に失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>顧客情報が見つかりません</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href={`/customer-management/${propertyId}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {customer.owner_name}
                </h1>
                <p className="text-muted-foreground">
                  {property?.name} - {customer.room_number || "部屋番号なし"}
                </p>
              </div>
            </div>
            <Button
              onClick={handleComplete}
              className="gap-2"
              variant={
                customer.search_status === "completed" ? "outline" : "default"
              }
            >
              <CheckCircle className="h-4 w-4" />
              {customer.search_status === "completed" ? "調査済み" : "調査完了"}
            </Button>
          </div>

          {/* Customer Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>顧客情報</CardTitle>
              <CardDescription>
                エクセルから読み込まれた基本情報
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">氏名</p>
                  <p className="font-medium">{customer.owner_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">部屋番号</p>
                  <p className="font-medium">{customer.room_number || "-"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">住所</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{customer.owner_address || "-"}</p>
                    {customer.owner_address && (
                      <a
                        href={`https://www.google.com/maps/place/${encodeURIComponent(
                          customer.owner_address
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        <MapPin className="h-4 w-4" />
                        地図で見る
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>情報検索・記録</CardTitle>
              <CardDescription>
                各検索媒体で情報を収集し、候補を記録してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SearchTabs
                customer={customer}
                searchRecords={searchRecords}
                onUpdate={fetchData}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
