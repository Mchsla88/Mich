export type LeadStatus = 'nowy' | 'research' | 'sekwencja' | 'wysłane' | 'odpowiedź' | 'zakończone';
export interface Lead {
    rowIndex: number;
    email: string;
    firma: string;
    website_url: string;
    imie: string;
    generuj: boolean;
    status: LeadStatus;
    research_notes?: string;
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
export interface EmailStep {
    subject: string;
    preheader: string;
    body_html: string;
    send_after_days: number;
}
export interface EmailSequence {
    steps: EmailStep[];
}
export interface GmailSendResult {
    success: boolean;
    messageId?: string;
    threadId?: string;
    error?: string;
}
export interface QueueItem {
    lead: Lead;
    stepNumber: 1 | 2 | 3;
    scheduledFor: Date;
    retries: number;
}
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
export interface SpreadsheetConfig {
    id: string;
    spreadsheetId: string;
    sheetName: string;
    senderEmail: string;
    senderName: string;
    replyToEmail?: string;
    signature?: string;
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleTokenExpiry?: number;
    aiProvider: 'anthropic' | 'gemini';
    aiApiKey?: string;
    limitPerHour?: number;
    limitPerDay?: number;
    name: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}
//# sourceMappingURL=types.d.ts.map