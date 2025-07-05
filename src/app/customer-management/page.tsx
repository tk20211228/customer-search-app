"use client";

import { useEffect, useState } from "react";
import { Plus, Upload, Building2, Users, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Property } from "@/types/customer";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function CustomerManagementDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("物件情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const getCompletionRate = (property: Property) => {
    if (property.total_customers === 0) return 0;
    return Math.round((property.completed_customers / property.total_customers) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                顧客管理システム
              </h1>
              <p className="text-muted-foreground text-lg">
                物件別の顧客情報を管理・検索
              </p>
            </div>
            <Link href="/customer-management/upload">
              <Button size="lg" className="gap-2">
                <Upload className="h-5 w-5" />
                新規アップロード
              </Button>
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  総物件数
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{properties.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  総顧客数
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {properties.reduce((sum, p) => sum + p.total_customers, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  調査完了数
                </CardTitle>
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {properties.reduce((sum, p) => sum + p.completed_customers, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Properties Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : properties.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  まだ物件が登録されていません
                </h3>
                <p className="text-muted-foreground mb-4">
                  エクセルファイルをアップロードして始めましょう
                </p>
                <Link href="/customer-management/upload">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    最初の物件を追加
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Link
                  key={property.id}
                  href={`/customer-management/${property.id}`}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="line-clamp-1">
                        {property.name}
                      </CardTitle>
                      <CardDescription>
                        {property.file_name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">顧客数</span>
                          <span className="font-medium">
                            {property.total_customers}名
                          </span>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">
                              調査進捗
                            </span>
                            <span className="font-medium">
                              {getCompletionRate(property)}%
                            </span>
                          </div>
                          <Progress value={getCompletionRate(property)} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          アップロード日: {new Date(property.upload_date).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}