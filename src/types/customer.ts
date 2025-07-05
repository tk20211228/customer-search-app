export interface Property {
  id: string;
  name: string;
  file_name: string;
  total_customers: number;
  completed_customers: number;
  upload_date: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  property_id: string;
  owner_name: string;
  owner_address?: string;
  room_number?: string;
  search_status: "pending" | "in_progress" | "completed";
  last_searched_at?: string;
  original_data?: Record<string, string | number>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SearchRecord {
  id: string;
  customer_id: string;
  search_source: "google" | "facebook" | "linkedin" | "eight";
  candidate_number: 1 | 2 | 3;
  company_name?: string;
  company_phone?: string;
  position?: string;
  source_url?: string;
  department?: string;
  company_address?: string;
  email?: string;
  confidence_score?: 1 | 2 | 3 | 4 | 5;
  is_primary: boolean;
  verified_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SearchLog {
  id: string;
  customer_id: string;
  search_source: string;
  action_type: "search_executed" | "data_saved" | "exported";
  query_params?: Record<string, string | number>;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
  created_by?: string;
}
