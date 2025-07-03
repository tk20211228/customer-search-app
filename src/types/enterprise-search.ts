export interface EnterpriseSearchResult {
  id: string;
  personName: string;
  personAddress: string;
  companyName: string;
  companyPhone?: string;
  position?: string;
  source: string;
  confidence: number;
  lastUpdated?: string;
  selected?: boolean;
}

export interface EnterpriseSearchResponse {
  results: EnterpriseSearchResult[];
  totalCount: number;
  query: string;
  searchTime: number;
}

export interface EnterpriseSearchRequest {
  personName: string;
  personAddress: string;
  searchOptions?: {
    includeCompanyName?: boolean;
    includeCompanyPhone?: boolean;
    includePosition?: boolean;
    minConfidence?: number;
  };
}

export interface VertexAISearchConfig {
  projectId: string;
  location: string;
  engineId: string;
  servingConfigId?: string;
}

export interface SearchFilter {
  field: string;
  value: string;
  operator: 'EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN';
}

export interface EnterpriseSearchFormData {
  personName: string;
  personAddress: string;
  searchPrecision: 'high' | 'standard';
  searchTargets: {
    companyName: boolean;
    companyPhone: boolean;
    position: boolean;
  };
}

export interface ExportData {
  personName: string;
  personAddress: string;
  companyName: string;
  companyPhone: string;
  position: string;
  confidence: number;
  source: string;
  lastUpdated: string;
}