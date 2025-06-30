import { SearchResult } from './search';

export interface SearchActionResult {
  success: boolean;
  data?: {
    results: SearchResult[];
    totalResults: number;
    searchTime: number;
  };
  error?: string;
  limitExceeded?: boolean;
}