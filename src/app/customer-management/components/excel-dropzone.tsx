"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileSpreadsheet, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExcelDropzoneProps {
  onDrop: (file: File) => void;
  isUploading?: boolean;
}

export function ExcelDropzone({ onDrop, isUploading }: ExcelDropzoneProps) {
  const onDropCallback = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onDrop(acceptedFiles[0]);
      }
    },
    [onDrop]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCallback,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        isUploading && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        {isDragActive ? (
          <>
            <Upload className="h-12 w-12 text-primary animate-bounce" />
            <p className="text-lg font-medium">
              ここにファイルをドロップしてください
            </p>
          </>
        ) : (
          <>
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-lg font-medium mb-2">
                エクセルファイルをドラッグ＆ドロップ
              </p>
              <p className="text-sm text-muted-foreground">
                または、クリックしてファイルを選択
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                対応形式: .xlsx, .xls
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}