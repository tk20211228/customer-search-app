"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Property, Customer } from "@/types/customer";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function CustomerListPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
        .eq("property_id", propertyId)
        .order("room_number", { ascending: true });

      if (customerError) throw customerError;
      setCustomers(customerData || []);
      setFilteredCustomers(customerData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const filterCustomers = useCallback(() => {
    if (!searchQuery) {
      setFilteredCustomers(customers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(
      (customer) =>
        customer.owner_name.toLowerCase().includes(query) ||
        customer.owner_address?.toLowerCase().includes(query) ||
        customer.room_number?.toLowerCase().includes(query)
    );
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    filterCustomers();
  }, [filterCustomers]);

  const handleExport = async () => {
    try {
      // 各顧客の検索記録を取得
      const { data: searchRecords, error } = await supabase
        .from("search_records")
        .select("*")
        .in(
          "customer_id",
          customers.map((c) => c.id)
        );

      if (error) throw error;

      // エクスポート用データの作成
      const exportData = customers.map((customer) => {
        const records = searchRecords?.filter(
          (r) => r.customer_id === customer.id
        );

        // original_dataから元のデータを取得
        const originalData = customer.original_data || {};

        const rowData: Record<string, string | number> = {
          物件名: property?.name || "",
          号室: customer.room_number || "",
          m: originalData.m || "",
          所有者: customer.owner_name,
          状況: originalData.状況 || "",
          自宅番号: originalData.自宅番号 || "",
          勤務先: originalData.勤務先 || "",
          勤務先番号: originalData.勤務先番号 || "",
          メモ: customer.notes || originalData.メモ || "",
          本人携帯: originalData.本人携帯 || "",
          所有者住所: customer.owner_address || "",
          検索ステータス:
            customer.search_status === "completed"
              ? "完了"
              : customer.search_status === "in_progress"
              ? "進行中"
              : "未着手",
        };

        // 各検索媒体の候補を追加
        ["google", "facebook", "linkedin", "eight"].forEach((source) => {
          [1, 2, 3].forEach((num) => {
            const record = records?.find(
              (r) => r.search_source === source && r.candidate_number === num
            );
            if (record) {
              const prefix = `${source.toUpperCase()}_候補${num}`;
              rowData[`${prefix}_会社名`] = record.company_name || "";
              rowData[`${prefix}_役職`] = record.position || "";
              rowData[`${prefix}_部署`] = record.department || "";
              rowData[`${prefix}_会社住所`] = record.company_address || "";
              rowData[`${prefix}_会社電話`] = record.company_phone || "";
              rowData[`${prefix}_メール`] = record.email || "";
              rowData[`${prefix}_URL`] = record.source_url || "";
              rowData[`${prefix}_信頼度`] = record.confidence_score || "";
            }
          });
        });

        return rowData;
      });

      // エクセルファイルの作成
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "顧客一覧");

      // ダウンロード
      const fileName = `${property?.name}_顧客一覧_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success("エクセルファイルをダウンロードしました");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("エクスポートに失敗しました");
    }
  };

  const getStatusBadge = (status: Customer["search_status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            完了
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            進行中
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            未着手
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
              <Link href="/customer-management">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {property?.name}
                </h1>
                <p className="text-muted-foreground">
                  顧客数: {customers.length}名
                </p>
              </div>
            </div>
            <Button onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              エクスポート
            </Button>
          </div>

          {/* Search and Filter */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>検索・フィルター</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="氏名、住所、部屋番号で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Table */}
          <Card>
            <CardHeader>
              <CardTitle>顧客一覧</CardTitle>
              <CardDescription>
                クリックして詳細情報の確認・検索を行う
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>部屋番号</TableHead>
                      <TableHead>所有者氏名</TableHead>
                      <TableHead>所有者住所</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>最終更新</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow
                        key={customer.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          router.push(
                            `/customer-management/${propertyId}/${customer.id}`
                          )
                        }
                      >
                        <TableCell className="font-medium">
                          {customer.room_number || "-"}
                        </TableCell>
                        <TableCell>{customer.owner_name}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {customer.owner_address || "-"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(customer.search_status)}
                        </TableCell>
                        <TableCell>
                          {customer.last_searched_at
                            ? new Date(
                                customer.last_searched_at
                              ).toLocaleDateString()
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
