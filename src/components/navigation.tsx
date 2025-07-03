"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Building2 } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname === "/enterprise-search") return "enterprise";
    return "basic";
  };

  return (
    <div className="mb-8">
      <Tabs value={getActiveTab()} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="basic" asChild>
            <Link 
              href="/" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Search className="h-4 w-4" />
              基本検索
            </Link>
          </TabsTrigger>
          <TabsTrigger value="enterprise" asChild>
            <Link 
              href="/enterprise-search" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Building2 className="h-4 w-4" />
              企業検索
            </Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}