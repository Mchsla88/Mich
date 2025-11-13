import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
// Create Sheets client with OAuth tokens
function createSheetsClient(accessToken, refreshToken) {
    const oauth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3002/auth/google/callback');
    // Set credentials
    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
    });
    // Auto-refresh tokens when expired
    oauth2Client.on('tokens', (tokens) => {
        if (tokens.refresh_token) {
            console.log('🔄 New refresh token received (Sheets)');
        }
        if (tokens.access_token) {
            console.log('🔄 Access token refreshed (Sheets)');
        }
    });
    return google.sheets({ version: 'v4', auth: oauth2Client });
}
// Legacy function for backward compatibility (no longer used with OAuth)
export async function initGoogleAuth() {
    console.log('⚠️  initGoogleAuth() is deprecated - using OAuth 2.0 instead');
    return null;
}
// Column mapping (A=0, B=1, etc.)
const COLUMNS = {
    EMAIL: 0, // A
    FIRMA: 1, // B
    WEBSITE_URL: 2, // C
    IMIE: 3, // D
    GENERUJ: 4, // E
    STATUS: 5, // F
    RESEARCH_NOTES: 6, // G
    RESEARCH_SOURCES: 7, // H
    RESEARCH_DATE: 8, // I
    STEP1_SUBJECT: 9, // J
    STEP1_BODY: 10, // K
    STEP1_SENT_DATE: 11, // L
    STEP1_MESSAGE_ID: 12, // M
    STEP2_SUBJECT: 13, // N
    STEP2_BODY: 14, // O
    STEP2_SENT_DATE: 15, // P
    STEP2_MESSAGE_ID: 16, // Q
    STEP3_SUBJECT: 17, // R
    STEP3_BODY: 18, // S
    STEP3_SENT_DATE: 19, // T
    STEP3_MESSAGE_ID: 20, // U
    REPLY_RECEIVED: 21, // V
    REPLY_DATE: 22, // W
    LAST_CHECK: 23, // X
    NOTATKI: 24, // Y
    CREATED_AT: 25, // Z
};
// Convert boolean string to boolean
function parseBoolean(value) {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1' || value === 'TRUE';
    }
    return false;
}
// Read all leads from sheet
export async function getLeads() {
    try {
        // NOTE: This function is for legacy single-spreadsheet mode
        // For multi-campaign mode, use processor-multi.service.ts
        console.warn('⚠️  getLeads() called - this is legacy code for service account mode');
        return [];
        /* Legacy code - requires service account:
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: config.googleSpreadsheetId,
          range: `${config.googleSheetName}!A2:Z`, // Skip header row
        });
    
        const rows = response.data.values || [];
    
        return rows.map((row, index): Lead => ({
          rowIndex: index + 2, // +2 because: 0-indexed + skip header
          email: row[COLUMNS.EMAIL] || '',
          firma: row[COLUMNS.FIRMA] || '',
          website_url: row[COLUMNS.WEBSITE_URL] || '',
          imie: row[COLUMNS.IMIE] || '',
          generuj: parseBoolean(row[COLUMNS.GENERUJ]),
          status: (row[COLUMNS.STATUS] as LeadStatus) || 'nowy',
          research_notes: row[COLUMNS.RESEARCH_NOTES],
          research_sources: row[COLUMNS.RESEARCH_SOURCES],
          research_date: row[COLUMNS.RESEARCH_DATE],
          step1_subject: row[COLUMNS.STEP1_SUBJECT],
          step1_body: row[COLUMNS.STEP1_BODY],
          step1_sent_date: row[COLUMNS.STEP1_SENT_DATE],
          step1_message_id: row[COLUMNS.STEP1_MESSAGE_ID],
          step2_subject: row[COLUMNS.STEP2_SUBJECT],
          step2_body: row[COLUMNS.STEP2_BODY],
          step2_sent_date: row[COLUMNS.STEP2_SENT_DATE],
          step2_message_id: row[COLUMNS.STEP2_MESSAGE_ID],
          step3_subject: row[COLUMNS.STEP3_SUBJECT],
          step3_body: row[COLUMNS.STEP3_BODY],
          step3_sent_date: row[COLUMNS.STEP3_SENT_DATE],
          step3_message_id: row[COLUMNS.STEP3_MESSAGE_ID],
          reply_received: parseBoolean(row[COLUMNS.REPLY_RECEIVED]),
          reply_date: row[COLUMNS.REPLY_DATE],
          last_check: row[COLUMNS.LAST_CHECK],
          notatki: row[COLUMNS.NOTATKI],
          created_at: row[COLUMNS.CREATED_AT],
        }));
        */
    }
    catch (error) {
        console.error('❌ Error reading leads from sheet:', error);
        throw error;
    }
}
// Get leads that need processing (generuj=true)
export async function getLeadsToProcess() {
    const allLeads = await getLeads();
    return allLeads.filter(lead => lead.generuj === true &&
        lead.status !== 'odpowiedź' &&
        lead.status !== 'zakończone');
}
// Update lead in sheet
export async function updateLead(lead) {
    console.warn('⚠️  updateLead() called - this is legacy code for service account mode');
    // NOTE: This function is for legacy single-spreadsheet mode
    // For multi-campaign mode, use processor-multi.service.ts
    /* Legacy code - requires service account:
    try {
      const row: any[] = [];
      row[COLUMNS.EMAIL] = lead.email;
      row[COLUMNS.FIRMA] = lead.firma;
      row[COLUMNS.WEBSITE_URL] = lead.website_url;
      row[COLUMNS.IMIE] = lead.imie;
      row[COLUMNS.GENERUJ] = lead.generuj;
      row[COLUMNS.STATUS] = lead.status;
      row[COLUMNS.RESEARCH_NOTES] = lead.research_notes || '';
      row[COLUMNS.RESEARCH_SOURCES] = lead.research_sources || '';
      row[COLUMNS.RESEARCH_DATE] = lead.research_date || '';
      row[COLUMNS.STEP1_SUBJECT] = lead.step1_subject || '';
      row[COLUMNS.STEP1_BODY] = lead.step1_body || '';
      row[COLUMNS.STEP1_SENT_DATE] = lead.step1_sent_date || '';
      row[COLUMNS.STEP1_MESSAGE_ID] = lead.step1_message_id || '';
      row[COLUMNS.STEP2_SUBJECT] = lead.step2_subject || '';
      row[COLUMNS.STEP2_BODY] = lead.step2_body || '';
      row[COLUMNS.STEP2_SENT_DATE] = lead.step2_sent_date || '';
      row[COLUMNS.STEP2_MESSAGE_ID] = lead.step2_message_id || '';
      row[COLUMNS.STEP3_SUBJECT] = lead.step3_subject || '';
      row[COLUMNS.STEP3_BODY] = lead.step3_body || '';
      row[COLUMNS.STEP3_SENT_DATE] = lead.step3_sent_date || '';
      row[COLUMNS.STEP3_MESSAGE_ID] = lead.step3_message_id || '';
      row[COLUMNS.REPLY_RECEIVED] = lead.reply_received || false;
      row[COLUMNS.REPLY_DATE] = lead.reply_date || '';
      row[COLUMNS.LAST_CHECK] = lead.last_check || '';
      row[COLUMNS.NOTATKI] = lead.notatki || '';
      row[COLUMNS.CREATED_AT] = lead.created_at || '';
  
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.googleSpreadsheetId,
        range: `${config.googleSheetName}!A${lead.rowIndex}:Z${lead.rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [row],
        },
      });
  
      console.log(`✅ Updated lead ${lead.email} (row ${lead.rowIndex})`);
    } catch (error) {
      console.error(`❌ Error updating lead ${lead.email}:`, error);
      throw error;
    }
    */
}
// Update specific fields of a lead
export async function updateLeadFields(rowIndex, updates) {
    console.warn('⚠️  updateLeadFields() called - this is legacy code for service account mode');
    // NOTE: This function is for legacy single-spreadsheet mode
    // For multi-campaign mode, use processor-multi.service.ts
    /* Legacy code - requires service account:
    try {
      // Read current lead
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: config.googleSpreadsheetId,
        range: `${config.googleSheetName}!A${rowIndex}:Z${rowIndex}`,
      });
  
      const currentRow = response.data.values?.[0] || [];
  
      // Merge updates
      if (updates.status !== undefined) currentRow[COLUMNS.STATUS] = updates.status;
      if (updates.research_notes !== undefined) currentRow[COLUMNS.RESEARCH_NOTES] = updates.research_notes;
      if (updates.research_sources !== undefined) currentRow[COLUMNS.RESEARCH_SOURCES] = updates.research_sources;
      if (updates.research_date !== undefined) currentRow[COLUMNS.RESEARCH_DATE] = updates.research_date;
      if (updates.step1_subject !== undefined) currentRow[COLUMNS.STEP1_SUBJECT] = updates.step1_subject;
      if (updates.step1_body !== undefined) currentRow[COLUMNS.STEP1_BODY] = updates.step1_body;
      if (updates.step1_sent_date !== undefined) currentRow[COLUMNS.STEP1_SENT_DATE] = updates.step1_sent_date;
      if (updates.step1_message_id !== undefined) currentRow[COLUMNS.STEP1_MESSAGE_ID] = updates.step1_message_id;
      if (updates.step2_subject !== undefined) currentRow[COLUMNS.STEP2_SUBJECT] = updates.step2_subject;
      if (updates.step2_body !== undefined) currentRow[COLUMNS.STEP2_BODY] = updates.step2_body;
      if (updates.step2_sent_date !== undefined) currentRow[COLUMNS.STEP2_SENT_DATE] = updates.step2_sent_date;
      if (updates.step2_message_id !== undefined) currentRow[COLUMNS.STEP2_MESSAGE_ID] = updates.step2_message_id;
      if (updates.step3_subject !== undefined) currentRow[COLUMNS.STEP3_SUBJECT] = updates.step3_subject;
      if (updates.step3_body !== undefined) currentRow[COLUMNS.STEP3_BODY] = updates.step3_body;
      if (updates.step3_sent_date !== undefined) currentRow[COLUMNS.STEP3_SENT_DATE] = updates.step3_sent_date;
      if (updates.step3_message_id !== undefined) currentRow[COLUMNS.STEP3_MESSAGE_ID] = updates.step3_message_id;
      if (updates.reply_received !== undefined) currentRow[COLUMNS.REPLY_RECEIVED] = updates.reply_received;
      if (updates.reply_date !== undefined) currentRow[COLUMNS.REPLY_DATE] = updates.reply_date;
      if (updates.last_check !== undefined) currentRow[COLUMNS.LAST_CHECK] = updates.last_check;
  
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.googleSpreadsheetId,
        range: `${config.googleSheetName}!A${rowIndex}:Z${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [currentRow],
        },
      });
  
      console.log(`✅ Updated fields for row ${rowIndex}`);
    } catch (error) {
      console.error(`❌ Error updating fields for row ${rowIndex}:`, error);
      throw error;
    }
    */
}
// ======================
// MULTI-SPREADSHEET SUPPORT
// ======================
// Read leads from specific spreadsheet
export async function getLeadsFrom(spreadsheetId, sheetName, accessToken, refreshToken) {
    try {
        const sheets = createSheetsClient(accessToken, refreshToken);
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A2:Z`,
        });
        const rows = response.data.values || [];
        return rows.map((row, index) => ({
            rowIndex: index + 2,
            email: row[COLUMNS.EMAIL] || '',
            firma: row[COLUMNS.FIRMA] || '',
            website_url: row[COLUMNS.WEBSITE_URL] || '',
            imie: row[COLUMNS.IMIE] || '',
            generuj: parseBoolean(row[COLUMNS.GENERUJ]),
            status: row[COLUMNS.STATUS] || 'nowy',
            research_notes: row[COLUMNS.RESEARCH_NOTES],
            research_sources: row[COLUMNS.RESEARCH_SOURCES],
            research_date: row[COLUMNS.RESEARCH_DATE],
            step1_subject: row[COLUMNS.STEP1_SUBJECT],
            step1_body: row[COLUMNS.STEP1_BODY],
            step1_sent_date: row[COLUMNS.STEP1_SENT_DATE],
            step1_message_id: row[COLUMNS.STEP1_MESSAGE_ID],
            step2_subject: row[COLUMNS.STEP2_SUBJECT],
            step2_body: row[COLUMNS.STEP2_BODY],
            step2_sent_date: row[COLUMNS.STEP2_SENT_DATE],
            step2_message_id: row[COLUMNS.STEP2_MESSAGE_ID],
            step3_subject: row[COLUMNS.STEP3_SUBJECT],
            step3_body: row[COLUMNS.STEP3_BODY],
            step3_sent_date: row[COLUMNS.STEP3_SENT_DATE],
            step3_message_id: row[COLUMNS.STEP3_MESSAGE_ID],
            reply_received: parseBoolean(row[COLUMNS.REPLY_RECEIVED]),
            reply_date: row[COLUMNS.REPLY_DATE],
            last_check: row[COLUMNS.LAST_CHECK],
            notatki: row[COLUMNS.NOTATKI],
            created_at: row[COLUMNS.CREATED_AT],
        }));
    }
    catch (error) {
        console.error(`❌ Error reading leads from ${spreadsheetId}/${sheetName}:`, error);
        throw error;
    }
}
// Get leads to process from specific spreadsheet
export async function getLeadsToProcessFrom(spreadsheetId, sheetName, accessToken, refreshToken) {
    const allLeads = await getLeadsFrom(spreadsheetId, sheetName, accessToken, refreshToken);
    return allLeads.filter(lead => lead.generuj === true &&
        lead.status !== 'odpowiedź' &&
        lead.status !== 'zakończone');
}
// Update lead fields in specific spreadsheet
export async function updateLeadFieldsIn(spreadsheetId, sheetName, rowIndex, updates, accessToken, refreshToken) {
    try {
        const sheets = createSheetsClient(accessToken, refreshToken);
        // Read current lead
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A${rowIndex}:Z${rowIndex}`,
        });
        const currentRow = response.data.values?.[0] || [];
        // Merge updates
        if (updates.status !== undefined)
            currentRow[COLUMNS.STATUS] = updates.status;
        if (updates.research_notes !== undefined)
            currentRow[COLUMNS.RESEARCH_NOTES] = updates.research_notes;
        if (updates.research_sources !== undefined)
            currentRow[COLUMNS.RESEARCH_SOURCES] = updates.research_sources;
        if (updates.research_date !== undefined)
            currentRow[COLUMNS.RESEARCH_DATE] = updates.research_date;
        if (updates.step1_subject !== undefined)
            currentRow[COLUMNS.STEP1_SUBJECT] = updates.step1_subject;
        if (updates.step1_body !== undefined)
            currentRow[COLUMNS.STEP1_BODY] = updates.step1_body;
        if (updates.step1_sent_date !== undefined)
            currentRow[COLUMNS.STEP1_SENT_DATE] = updates.step1_sent_date;
        if (updates.step1_message_id !== undefined)
            currentRow[COLUMNS.STEP1_MESSAGE_ID] = updates.step1_message_id;
        if (updates.step2_subject !== undefined)
            currentRow[COLUMNS.STEP2_SUBJECT] = updates.step2_subject;
        if (updates.step2_body !== undefined)
            currentRow[COLUMNS.STEP2_BODY] = updates.step2_body;
        if (updates.step2_sent_date !== undefined)
            currentRow[COLUMNS.STEP2_SENT_DATE] = updates.step2_sent_date;
        if (updates.step2_message_id !== undefined)
            currentRow[COLUMNS.STEP2_MESSAGE_ID] = updates.step2_message_id;
        if (updates.step3_subject !== undefined)
            currentRow[COLUMNS.STEP3_SUBJECT] = updates.step3_subject;
        if (updates.step3_body !== undefined)
            currentRow[COLUMNS.STEP3_BODY] = updates.step3_body;
        if (updates.step3_sent_date !== undefined)
            currentRow[COLUMNS.STEP3_SENT_DATE] = updates.step3_sent_date;
        if (updates.step3_message_id !== undefined)
            currentRow[COLUMNS.STEP3_MESSAGE_ID] = updates.step3_message_id;
        if (updates.reply_received !== undefined)
            currentRow[COLUMNS.REPLY_RECEIVED] = updates.reply_received;
        if (updates.reply_date !== undefined)
            currentRow[COLUMNS.REPLY_DATE] = updates.reply_date;
        if (updates.last_check !== undefined)
            currentRow[COLUMNS.LAST_CHECK] = updates.last_check;
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A${rowIndex}:Z${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [currentRow],
            },
        });
        console.log(`✅ Updated fields for row ${rowIndex} in ${sheetName}`);
    }
    catch (error) {
        console.error(`❌ Error updating fields in ${spreadsheetId}/${sheetName}:`, error);
        throw error;
    }
}
export default {
    initGoogleAuth,
    getLeads,
    getLeadsToProcess,
    updateLead,
    updateLeadFields,
    getLeadsFrom,
    getLeadsToProcessFrom,
    updateLeadFieldsIn,
};
//# sourceMappingURL=sheets.service.js.map