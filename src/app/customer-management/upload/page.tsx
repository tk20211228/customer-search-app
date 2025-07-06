"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ExcelDropzone } from "../components/excel-dropzone";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface PreviewData {
  headers: string[];
  rows: (string | number)[][];
  fileName: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "complete">("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileDrop = async (file: File) => {
    try {
      setUploadedFile(file);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length === 0) {
        toast.error("ファイルが空です");
        return;
      }

      // ヘッダーがある場合とない場合の処理
      let headers: string[];
      let rows: (string | number)[][];

      // 最初の行が列名の可能性をチェック
      const firstRow = jsonData[0] as (string | number)[];
      const hasHeaders =
        firstRow[0] === "物件名" ||
        firstRow[1] === "号室" ||
        firstRow[3] === "所有者";

      if (hasHeaders) {
        headers = firstRow as string[];
        rows = jsonData
          .slice(1)
          .filter((row: unknown) => Array.isArray(row) && row.length > 0) as (
          | string
          | number
        )[][];
      } else {
        // ヘッダーがない場合はデフォルトヘッダーを使用
        headers = [
          "物件名",
          "号室",
          "m",
          "所有者",
          "状況",
          "自宅番号",
          "勤務先",
          "勤務先番号",
          "メモ",
          "本人携帯",
          "所有者住所",
        ];
        rows = jsonData.filter(
          (row: unknown) => Array.isArray(row) && row.length > 0
        ) as (string | number)[][];
      }

      setPreviewData({
        headers,
        rows: rows.slice(0, 10), // プレビューは最初の10行まで
        fileName: file.name,
      });
      setStep("preview");
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("ファイルの読み込みに失敗しました");
    }
  };

  const handleImport = async () => {
    if (!previewData) return;

    setIsUploading(true);
    try {
      // エクセルファイルの全データを再読み込み（プレビューは10件のみなので）
      let allRows = previewData.rows;

      if (uploadedFile) {
        const data = await uploadedFile.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // ヘッダー行のチェック
        const firstRow = jsonData[0] as (string | number)[];
        const hasHeaders =
          firstRow[0] === "物件名" ||
          firstRow[1] === "号室" ||
          firstRow[3] === "所有者";

        if (hasHeaders) {
          allRows = jsonData
            .slice(1)
            .filter((row: unknown) => Array.isArray(row) && row.length > 0) as (
            | string
            | number
          )[][];
        } else {
          allRows = jsonData.filter(
            (row: unknown) => Array.isArray(row) && row.length > 0
          ) as (string | number)[][];
        }
      }

      // 物件を作成（nameはファイル名から拡張子を除去）
      const propertyName = previewData.fileName.replace(/\.[^/.]+$/, "");
      
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .insert({
          name: propertyName,
          file_name: previewData.fileName,
          total_customers: allRows.length,
          completed_customers: 0,
        })
        .select()
        .single();

      if (propertyError) throw propertyError;

      // 列のインデックスマッピング（実際のエクセル形式に基づく）
      const columnMapping = {
        propertyName: 0, // 物件名
        roomNumber: 1, // 号室
        m: 2, // m
        ownerName: 3, // 所有者
        status: 4, // 状況
        homePhone: 5, // 自宅番号
        workplace: 6, // 勤務先
        workPhone: 7, // 勤務先番号
        memo: 8, // メモ
        mobilePhone: 9, // 本人携帯
        ownerAddress: 10, // 所有者住所
      };

      // 顧客データを作成
      const customerData = allRows.map((row) => {
        const customerObj: {
          property_id: string;
          owner_name: string;
          owner_address: string;
          room_number: string;
          search_status: string;
          notes: string;
          original_data: Record<string, string | number>;
        } = {
          property_id: property.id,
          owner_name: (row[columnMapping.ownerName] as string) || "名前未設定",
          owner_address: (row[columnMapping.ownerAddress] as string) || "",
          room_number: (row[columnMapping.roomNumber] as string) || "",
          search_status: "pending",
          notes: (row[columnMapping.memo] as string) || "",
          original_data: {
            物件名: row[columnMapping.propertyName],
            号室: row[columnMapping.roomNumber],
            m: row[columnMapping.m],
            所有者: row[columnMapping.ownerName],
            状況: row[columnMapping.status],
            自宅番号: row[columnMapping.homePhone],
            勤務先: row[columnMapping.workplace],
            勤務先番号: row[columnMapping.workPhone],
            メモ: row[columnMapping.memo],
            本人携帯: row[columnMapping.mobilePhone],
            所有者住所: row[columnMapping.ownerAddress],
          },
        };
        return customerObj;
      });

      const { error: customersError } = await supabase
        .from("customers")
        .insert(customerData);

      if (customersError) throw customersError;

      toast.success("データのインポートが完了しました");
      setStep("complete");

      // 3秒後にダッシュボードへ遷移
      setTimeout(() => {
        router.push("/customer-management");
      }, 3000);
    } catch (error) {
      console.error("Error importing data:", error);
      toast.error("データのインポートに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/customer-management">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                エクセルファイルアップロード
              </h1>
              <p className="text-muted-foreground">
                顧客名簿のエクセルファイルをアップロードしてください
              </p>
            </div>
          </div>

          {/* Upload Step */}
          {step === "upload" && (
            <Card>
              <CardHeader>
                <CardTitle>ファイルを選択</CardTitle>
                <CardDescription>
                  顧客情報が記載されたエクセルファイルをアップロードしてください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExcelDropzone onDrop={handleFileDrop} />
              </CardContent>
            </Card>
          )}

          {/* Preview Step */}
          {step === "preview" && previewData && (
            <Card>
              <CardHeader>
                <CardTitle>データプレビュー</CardTitle>
                <CardDescription>
                  {previewData.fileName} - 最初の10件を表示
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {previewData.headers.map((header, index) => (
                          <TableHead key={index}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.rows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <TableCell key={cellIndex}>
                              {cell?.toString() || "-"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep("upload");
                      setPreviewData(null);
                    }}
                    disabled={isUploading}
                  >
                    戻る
                  </Button>
                  <Button onClick={handleImport} disabled={isUploading}>
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        インポート中...
                      </div>
                    ) : (
                      "インポート開始"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Complete Step */}
          {step === "complete" && (
            <Card className="text-center">
              <CardContent className="py-12">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">インポート完了</h2>
                <p className="text-muted-foreground mb-6">
                  データが正常にインポートされました
                </p>
                <Link href="/customer-management">
                  <Button>ダッシュボードへ戻る</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
