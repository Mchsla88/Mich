export interface Lead {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  domain?: string;
  title?: string;
  phone?: string;
  linkedin?: string;
  twitter?: string;

  // Company enrichment
  companySize?: string;
  industry?: string;
  companyDescription?: string;
  companyLogo?: string;
  companyLocation?: string;
  companyWebsite?: string;
  techStack?: string[];

  // Email enrichment
  emailValid?: boolean;
  emailScore?: number;

  // Lead scoring
  leadScore?: number;
  leadGrade?: 'A' | 'B' | 'C' | 'D' | 'F';

  // AI Research
  aiResearch?: string;
  aiInsights?: string;

  // Metadata
  enrichmentStatus?: 'pending' | 'enriching' | 'completed' | 'failed';
  enrichmentSource?: string;
  lastEnriched?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Custom fields
  [key: string]: any;
}

export interface EnrichmentConfig {
  companyEnrichment: boolean;
  emailEnrichment: boolean;
  contactEnrichment: boolean;
  aiResearch: boolean;
  leadScoring: boolean;
}

export interface EnrichmentSource {
  name: string;
  enabled: boolean;
  priority: number;
  apiKey?: string;
  rateLimit?: number;
}

export interface WorkflowConfig {
  autoEnrich: boolean;
  waterfallSources: EnrichmentSource[];
  retryOnFailure: boolean;
  maxRetries: number;
}

export interface ApiKeys {
  gemini?: string;
  clearbit?: string;
  hunter?: string;
  googleSearch?: string;
  googleSearchEngineId?: string;
}

export interface EnrichmentResult {
  success: boolean;
  data?: Partial<Lead>;
  error?: string;
  source?: string;
}

export type EnrichmentProvider =
  | 'gemini-ai'
  | 'clearbit'
  | 'hunter'
  | 'google-search'
  | 'web-scraping';
