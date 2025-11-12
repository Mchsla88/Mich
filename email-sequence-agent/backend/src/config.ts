import dotenv from 'dotenv';
import { Config } from './types.js';

dotenv.config();

export const config: Config = {
  port: parseInt(process.env.PORT || '3002', 10),
  googleSpreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || '13CYoUh8BpVi4dOjeXrU1NFIt9PTVpKKhrdQGpggYzZ4',
  googleSheetName: process.env.GOOGLE_SHEET_NAME || 'Leads',
  senderEmail: process.env.SENDER_EMAIL || 'michal@mayiawebsite.pl',
  senderName: process.env.SENDER_NAME || 'Michał Sławiński',
  replyToEmail: process.env.REPLY_TO_EMAIL || 'michal@mayiawebsite.pl',
  dryRun: process.env.DRY_RUN === 'true',
  testEmail: process.env.TEST_EMAIL,
  limitPerHour: parseInt(process.env.LIMIT_PER_HOUR || '10', 10),
  limitPerDay: parseInt(process.env.LIMIT_PER_DAY || '50', 10),
  sendHourStart: parseInt(process.env.SEND_HOUR_START || '9', 10),
  sendHourEnd: parseInt(process.env.SEND_HOUR_END || '18', 10),
  sendWeekends: process.env.SEND_WEEKENDS === 'true',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
  cronIntervalMinutes: parseInt(process.env.CRON_INTERVAL_MINUTES || '5', 10),
  timezone: process.env.TIMEZONE || 'Europe/Warsaw',
  step2DelayDays: parseInt(process.env.STEP2_DELAY_DAYS || '3', 10),
  step3DelayDays: parseInt(process.env.STEP3_DELAY_DAYS || '7', 10),
  maxLeadsPerDay: parseInt(process.env.MAX_LEADS_PER_DAY || '50', 10),
  useEmailThreads: process.env.USE_EMAIL_THREADS !== 'false',
};

// Validation
if (!config.anthropicApiKey) {
  console.warn('⚠️  ANTHROPIC_API_KEY not set! AI features will not work.');
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn('⚠️  GOOGLE_APPLICATION_CREDENTIALS not set! Google Sheets/Gmail will not work.');
}

export default config;
