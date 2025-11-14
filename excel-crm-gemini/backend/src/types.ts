export interface ResearchRequest {
  rowId: string;
  company: string;
  website: string;
  email: string;
  promptResearch: string;
}

export interface EmailGenerationRequest {
  rowId: string;
  researchResults: string;
  promptSequence: string;
  recipientName: string;
  recipientEmail: string;
  company: string;
}

export interface ResearchResponse {
  rowId: string;
  researchResults: string;
  success: boolean;
  error?: string;
}

export interface EmailGenerationResponse {
  rowId: string;
  email1: string;
  email2: string;
  email3: string;
  success: boolean;
  error?: string;
}
