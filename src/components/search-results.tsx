"use client";

import { useState } from "react";
import { Download, Building2, MapPin, Phone, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchResult } from "@/types/search";

interface SearchResultsProps {
  results: SearchResult[];
  onExport: (selectedResults: SearchResult[]) => void;
}

export function SearchResults({ results, onExport }: SearchResultsProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(results.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectResult = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExport = () => {
    const selectedResults = results.filter(r => selectedIds.has(r.id));
    onExport(selectedResults);
  };

  const allSelected = results.length > 0 && selectedIds.size === results.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < results.length;

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              検索結果 ({results.length}件)
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  {someSelected && !allSelected && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-2 h-0.5 bg-primary rounded"></div>
                    </div>
                  )}
                </div>
                <label 
                  htmlFor="select-all" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  すべて選択
                </label>
              </div>
              <Button 
                onClick={handleExport} 
                disabled={selectedIds.size === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                エクスポート ({selectedIds.size})
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {results.map((result) => (
          <Card key={result.id} className="transition-all hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Checkbox
                  id={`result-${result.id}`}
                  checked={selectedIds.has(result.id)}
                  onCheckedChange={(checked) => 
                    handleSelectResult(result.id, checked as boolean)
                  }
                  className="mt-1"
                />
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{result.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.snippet}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">会社名:</span>
                        <span>{result.company}</span>
                      </div>
                    )}
                    
                    {result.position && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">役職:</span>
                        <span>{result.position}</span>
                      </div>
                    )}
                    
                    {result.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">住所:</span>
                        <span>{result.address}</span>
                      </div>
                    )}
                    
                    {result.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">電話:</span>
                        <span>{result.phone}</span>
                      </div>
                    )}
                    
                    {result.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Email:</span>
                        <span>{result.email}</span>
                      </div>
                    )}
                    
                    {result.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Website:</span>
                        <a 
                          href={result.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {result.website}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    出典: {result.source}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}