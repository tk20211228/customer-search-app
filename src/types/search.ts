export interface SearchResult {
  id: string;
  name: string;
  company?: string;
  position?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  source: string;
  snippet: string;
}

export interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
}