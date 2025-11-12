// Lead status types
export type LeadStatus =
  | 'nowy'
  | 'research'
  | 'sekwencja'
  | 'wysłane'
  | 'odpowiedź'
  | 'zakończone';

// Lead data from Google Sheets
export interface Lead {
  rowIndex: number; // Row number in sheet (for updates)
  email: string;
  firma: string;
  website_url: string;
  imie: string;
  generuj: boolean;
  status: LeadStatus;
  research_notes?: string; // JSON string
  research_sources?: string;
  research_date?: string;
  step1_subject?: string;
  step1_body?: string;
  step1_sent_date?: string;
  step1_message_id?: string;
  step2_subject?: string;
  step2_body?: string;
  step2_sent_date?: string;
  step2_message_id?: string;
  step3_subject?: string;
  step3_body?: string;
  step3_sent_date?: string;
  step3_message_id?: string;
  reply_received?: boolean;
  reply_date?: string;
  last_check?: string;
  notatki?: string;
  created_at?: string;
}

// Research result types
export interface ResearchIssue {
  area: string;
  finding: string;
  evidence: string;
  impact: string;
  confidence: 'wysokie' | 'średnie' | 'niskie';
}

export interface ResearchResult {
  summary: string;
  issues: ResearchIssue[];
  quick_wins: string[];
  sources: string[];
}

// Email sequence step
export interface EmailStep {
  subject: string;
  preheader: string;
  body_html: string;
  send_after_days: number;
}

// Email sequence result
export interface EmailSequence {
  steps: EmailStep[];
}

// Gmail send result
export interface GmailSendResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

// Send queue item
export interface QueueItem {
  lead: Lead;
  stepNumber: 1 | 2 | 3;
  scheduledFor: Date;
  retries: number;
}

// Rate limiter state
export interface RateLimiterState {
  hourly: {
    count: number;
    resetAt: Date;
  };
  daily: {
    count: number;
    resetAt: Date;
  };
}

// Config
export interface Config {
  port: number;
  googleSpreadsheetId: string;
  googleSheetName: string;
  senderEmail: string;
  senderName: string;
  replyToEmail: string;
  dryRun: boolean;
  testEmail?: string;
  limitPerHour: number;
  limitPerDay: number;
  sendHourStart: number;
  sendHourEnd: number;
  sendWeekends: boolean;
  anthropicApiKey: string;
  aiModel: string;
  cronIntervalMinutes: number;
  timezone: string;
  step2DelayDays: number;
  step3DelayDays: number;
  maxLeadsPerDay: number;
  useEmailThreads: boolean;
}

// System state
export interface SystemState {
  lastRun?: Date;
  totalLeadsProcessed: number;
  totalEmailsSent: number;
  totalRepliesReceived: number;
  errors: Array<{
    timestamp: Date;
    error: string;
    lead?: string;
  }>;
}

// Spreadsheet configuration (multi-spreadsheet support)
export interface SpreadsheetConfig {
  id: string; // Unique ID for this config
  spreadsheetId: string; // Google Spreadsheet ID
  sheetName: string; // Sheet name (e.g., "Leads")
  senderEmail: string; // Email to send from
  senderName: string; // Sender display name
  replyToEmail?: string; // Reply-to email (optional)
  signature?: string; // Email signature HTML (optional, uses default if not provided)
  name: string; // Friendly name (e.g., "Kampania Web Design")
  active: boolean; // Is this spreadsheet active?
  createdAt: string;
  updatedAt: string;
}
