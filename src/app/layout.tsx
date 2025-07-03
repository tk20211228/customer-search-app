import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navigation } from "@/components/navigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "顧客名簿検索アプリ",
  description: "氏名から会社名・勤務先住所を検索してExcel出力",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  顧客名簿検索アプリ
                </h1>
                <p className="text-muted-foreground text-lg">
                  氏名から会社名・勤務先住所を検索してExcel出力
                </p>
              </div>
              <Navigation />
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
