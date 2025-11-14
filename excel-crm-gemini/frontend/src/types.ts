export interface CRMRow {
  id: string;
  name: string;
  email: string;
  company: string;
  website: string;
  position: string;
  promptResearch: string;
  promptSequence: string;
  researchResults: string;
  status: 'Draft' | 'Generate' | 'Researching' | 'Generating Emails' | 'Complete';
  email1: string;
  dataEmail1: string;
  email2: string;
  dataEmail2: string;
  email3: string;
  dataEmail3: string;
  notes: string;
}

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
}

export interface EmailGenerationResponse {
  rowId: string;
  email1: string;
  email2: string;
  email3: string;
  success: boolean;
}
