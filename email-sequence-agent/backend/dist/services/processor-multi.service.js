import * as sheetsService from './sheets.service.js';
import * as gmailService from './gmail.service.js';
import * as researchService from './research.service.js';
import * as sequenceService from './sequence.service.js';
import * as geminiService from './gemini.service.js';
import * as spreadsheetStorage from './spreadsheet.storage.js';
import config from '../config.js';
// Process research for all active spreadsheets
export async function processAllResearch() {
    try {
        console.log('\n🔍 === PROCESSING RESEARCH (MULTI-SPREADSHEET) ===');
        const spreadsheets = await spreadsheetStorage.getActiveSpreadsheets();
        if (spreadsheets.length === 0) {
            console.log('No active spreadsheets');
            return 0;
        }
        console.log(`Found ${spreadsheets.length} active spreadsheet(s)`);
        let totalProcessed = 0;
        for (const spreadsheet of spreadsheets) {
            console.log(`\n📚 Processing spreadsheet: ${spreadsheet.name}`);
            const processed = await processResearchForSpreadsheet(spreadsheet);
            totalProcessed += processed;
        }
        console.log(`\n✅ Total research processed: ${totalProcessed}`);
        return totalProcessed;
    }
    catch (error) {
        console.error('❌ Error in processAllResearch:', error);
        return 0;
    }
}
// Process research for specific spreadsheet
async function processResearchForSpreadsheet(spreadsheet) {
    try {
        // Validate OAuth tokens
        if (!spreadsheet.googleAccessToken || !spreadsheet.googleRefreshToken) {
            console.log(`  ⚠️  Skipping ${spreadsheet.name} - missing OAuth tokens. Please authorize with Google.`);
            return 0;
        }
        const leads = await sheetsService.getLeadsToProcessFrom(spreadsheet.spreadsheetId, spreadsheet.sheetName, spreadsheet.googleAccessToken, spreadsheet.googleRefreshToken);
        const leadsNeedingResearch = leads.filter(lead => lead.status === 'nowy' && !lead.research_notes);
        if (leadsNeedingResearch.length === 0) {
            console.log(`  No leads needing research in ${spreadsheet.name}`);
            return 0;
        }
        console.log(`  Found ${leadsNeedingResearch.length} leads needing research`);
        let processed = 0;
        for (const lead of leadsNeedingResearch.slice(0, config.maxLeadsPerDay)) {
            try {
                console.log(`  📊 Researching: ${lead.firma} (${lead.email})`);
                // Update status
                await sheetsService.updateLeadFieldsIn(spreadsheet.spreadsheetId, spreadsheet.sheetName, lead.rowIndex, { status: 'research' }, spreadsheet.googleAccessToken, spreadsheet.googleRefreshToken);
                // Perform research using configured AI provider
                let researchResult;
                if (spreadsheet.aiProvider === 'gemini') {
                    const apiKey = spreadsheet.aiApiKey || process.env.GEMINI_API_KEY || config.anthropicApiKey;
                    console.log(`  🤖 Using Gemini AI for research`);
                    researchResult = await geminiService.performResearch(lead.website_url, apiKey);
                }
                else {
                    // Default to Anthropic
                    console.log(`  🤖 Using Anthropic Claude for research`);
                    researchResult = await researchService.performResearch(lead.firma, lead.website_url, lead.imie);
                }
                // Save results
                await sheetsService.updateLeadFieldsIn(spreadsheet.spreadsheetId, spreadsheet.sheetName, lead.rowIndex, {
                    research_notes: JSON.stringify(researchResult),
                    research_sources: researchResult.sources.join(', '),
                    research_date: new Date().toISOString(),
                }, spreadsheet.googleAccessToken, spreadsheet.googleRefreshToken);
                console.log(`  ✅ Research completed for ${lead.firma}`);
                processed++;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            catch (error) {
                console.error(`  ❌ Error processing research for ${lead.email}:`, error);
            }
        }
        return processed;
    }
    catch (error) {
        console.error(`❌ Error in processResearchForSpreadsheet:`, error);
        return 0;
    }
}
// Process sequence generation for all active spreadsheets
export async function processAllSequenceGeneration() {
    try {
        console.log('\n📧 === PROCESSING SEQUENCE GENERATION (MULTI-SPREADSHEET) ===');
        const spreadsheets = await spreadsheetStorage.getActiveSpreadsheets();
        if (spreadsheets.length === 0) {
            console.log('No active spreadsheets');
            return 0;
        }
        let totalProcessed = 0;
        for (const spreadsheet of spreadsheets) {
            console.log(`\n📚 Processing spreadsheet: ${spreadsheet.name}`);
            const processed = await processSequenceForSpreadsheet(spreadsheet);
            totalProcessed += processed;
        }
        console.log(`\n✅ Total sequences generated: ${totalProcessed}`);
        return totalProcessed;
    }
    catch (error) {
        console.error('❌ Error in processAllSequenceGeneration:', error);
        return 0;
    }
}
// Process sequence generation for specific spreadsheet
async function processSequenceForSpreadsheet(spreadsheet) {
    try {
        // Validate OAuth tokens
        if (!spreadsheet.googleAccessToken || !spreadsheet.googleRefreshToken) {
            console.log(`  ⚠️  Skipping ${spreadsheet.name} - missing OAuth tokens. Please authorize with Google.`);
            return 0;
        }
        const leads = await sheetsService.getLeadsToProcessFrom(spreadsheet.spreadsheetId, spreadsheet.sheetName, spreadsheet.googleAccessToken, spreadsheet.googleRefreshToken);
        const leadsNeedingSequence = leads.filter(lead => lead.research_notes &&
            !lead.step1_subject &&
            lead.status !== 'sekwencja' &&
            lead.status !== 'wysłane');
        if (leadsNeedingSequence.length === 0) {
            console.log(`  No leads needing sequence in ${spreadsheet.name}`);
            return 0;
        }
        console.log(`  Found ${leadsNeedingSequence.length} leads needing sequence`);
        let processed = 0;
        for (const lead of leadsNeedingSequence) {
            try {
                console.log(`  ✉️  Generating sequence: ${lead.firma} (${lead.email})`);
                const researchResult = JSON.parse(lead.research_notes);
                // Generate sequence with custom sender, signature, and AI provider
                let sequence;
                if (spreadsheet.aiProvider === 'gemini') {
                    const apiKey = spreadsheet.aiApiKey || process.env.GEMINI_API_KEY || config.anthropicApiKey;
                    console.log(`  🤖 Using Gemini AI for sequence generation`);
                    sequence = await geminiService.generateSequence(lead.firma, lead.website_url, lead.imie, researchResult, apiKey, spreadsheet.signature);
                }
                else {
                    // Default to Anthropic
                    console.log(`  🤖 Using Anthropic Claude for sequence generation`);
                    sequence = await sequenceService.generateSequence(lead.firma, lead.website_url, lead.imie, researchResult, spreadsheet.signature);
                }
                // Save sequence
                await sheetsService.updateLeadFieldsIn(spreadsheet.spreadsheetId, spreadsheet.sheetName, lead.rowIndex, {
                    status: 'sekwencja',
                    step1_subject: sequence.steps[0].subject,
                    step1_body: sequence.steps[0].body_html,
                    step2_subject: sequence.steps[1].subject,
                    step2_body: sequence.steps[1].body_html,
                    step3_subject: sequence.steps[2].subject,
                    step3_body: sequence.steps[2].body_html,
                }, spreadsheet.googleAccessToken, spreadsheet.googleRefreshToken);
                console.log(`  ✅ Sequence generated for ${lead.firma}`);
                processed++;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            catch (error) {
                console.error(`  ❌ Error generating sequence for ${lead.email}:`, error);
            }
        }
        return processed;
    }
    catch (error) {
        console.error(`❌ Error in processSequenceForSpreadsheet:`, error);
        return 0;
    }
}
// Process sending for all active spreadsheets
export async function processAllSending() {
    try {
        console.log('\n📤 === PROCESSING SENDING (MULTI-SPREADSHEET) ===');
        const spreadsheets = await spreadsheetStorage.getActiveSpreadsheets();
        if (spreadsheets.length === 0) {
            console.log('No active spreadsheets');
            return 0;
        }
        let totalSent = 0;
        for (const spreadsheet of spreadsheets) {
            console.log(`\n📚 Processing spreadsheet: ${spreadsheet.name}`);
            const sent = await processSendingForSpreadsheet(spreadsheet);
            totalSent += sent;
        }
        console.log(`\n✅ Total emails sent: ${totalSent}`);
        return totalSent;
    }
    catch (error) {
        console.error('❌ Error in processAllSending:', error);
        return 0;
    }
}
// Process sending for specific spreadsheet (with custom sender)
async function processSendingForSpreadsheet(spreadsheet) {
    try {
        // Validate OAuth tokens
        if (!spreadsheet.googleAccessToken || !spreadsheet.googleRefreshToken) {
            console.log(`  ⚠️  Skipping ${spreadsheet.name} - missing OAuth tokens. Please authorize with Google.`);
            return 0;
        }
        const leads = await sheetsService.getLeadsToProcessFrom(spreadsheet.spreadsheetId, spreadsheet.sheetName, spreadsheet.googleAccessToken, spreadsheet.googleRefreshToken);
        const now = new Date();
        let sent = 0;
        for (const lead of leads) {
            if (lead.reply_received) {
                continue;
            }
            if (!lead.step1_subject || !lead.step1_body) {
                continue;
            }
            try {
                // Step 1: Send if not sent yet
                if (!lead.step1_sent_date) {
                    console.log(`  📨 Sending Step 1 to ${lead.email} (${lead.firma}) from ${spreadsheet.senderEmail}`);
                    // Override config sender and limits for this email
                    const originalSender = config.senderEmail;
                    const originalSenderName = config.senderName;
                    const originalLimitPerHour = config.limitPerHour;
                    const originalLimitPerDay = config.limitPerDay;
                    config.senderEmail = spreadsheet.senderEmail;
                    config.senderName = spreadsheet.senderName;
                    if (spreadsheet.limitPerHour)
                        config.limitPerHour = spreadsheet.limitPerHour;
                    if (spreadsheet.limitPerDay)
                        config.limitPerDay = spreadsheet.limitPerDay;
                    const result = await gmailService.sendEmail(lead.email, lead.step1_subject, lead.step1_body, spreadsheet.googleAccessToken, spreadsheet.googleRefreshToken);
                    // Restore original config
                    config.senderEmail = originalSender;
                    config.senderName = originalSenderName;
                    config.limitPerHour = originalLimitPerHour;
                    config.limitPerDay = originalLimitPerDay;
                    if (result.success) {
                        await sheetsService.updateLeadFieldsIn(spreadsheet.spreadsheetId, spreadsheet.sheetName, lead.rowIndex, {
                            status: 'wysłane',
                            step1_sent_date: now.toISOString(),
                            step1_message_id: result.messageId,
                        }, spreadsheet.googleAccessToken, spreadsheet.googleRefreshToken);
                        sent++;
                        console.log(`  ✅ Step 1 sent to ${lead.email}`);
                    }
                    else {
                        console.log(`  ❌ Failed: ${result.error}`);
                    }
                    continue;
                }
                // Step 2
                if (lead.step1_sent_date && !lead.step2_sent_date && lead.step2_subject) {
                    const step1Date = new Date(lead.step1_sent_date);
                    const daysSince = (now.getTime() - step1Date.getTime()) / (1000 * 60 * 60 * 24);
                    if (daysSince >= config.step2DelayDays) {
                        console.log(`  📨 Sending Step 2 to ${lead.email} from ${spreadsheet.senderEmail}`);
                        const originalSender = config.senderEmail;
                        const originalSenderName = config.senderName;
                        const originalLimitPerHour = config.limitPerHour;
                        const originalLimitPerDay = config.limitPerDay;
                        config.senderEmail = spreadsheet.senderEmail;
                        config.senderName = spreadsheet.senderName;
                        if (spreadsheet.limitPerHour)
                            config.limitPerHour = spreadsheet.limitPerHour;
                        if (spreadsheet.limitPerDay)
                            config.limitPerDay = spreadsheet.limitPerDay;
                        const result = await gmailService.sendEmail(lead.email, lead.step2_subject, lead.step2_body, spreadsheet.googleAccessToken, spreadsheet.googleRefreshToken, {
                            threadId: config.useEmailThreads ? lead.step1_message_id : undefined,
                            inReplyTo: config.useEmailThreads ? lead.step1_message_id : undefined,
                        });
                        config.senderEmail = originalSender;
                        config.senderName = originalSenderName;
                        config.limitPerHour = originalLimitPerHour;
                        config.limitPerDay = originalLimitPerDay;
                        if (result.success) {
                            await sheetsService.updateLeadFieldsIn(spreadsheet.spreadsheetId, spreadsheet.sheetName, lead.rowIndex, {
                                step2_sent_date: now.toISOString(),
                                step2_message_id: result.messageId,
                            }, spreadsheet.googleAccessToken, spreadsheet.googleRefreshToken);
                            sent++;
                            console.log(`  ✅ Step 2 sent to ${lead.email}`);
                        }
                    }
                }
                // Step 3
                if (lead.step1_sent_date && !lead.step3_sent_date && lead.step3_subject) {
                    const step1Date = new Date(lead.step1_sent_date);
                    const daysSince = (now.getTime() - step1Date.getTime()) / (1000 * 60 * 60 * 24);
                    if (daysSince >= config.step3DelayDays) {
                        console.log(`  📨 Sending Step 3 to ${lead.email} from ${spreadsheet.senderEmail}`);
                        const originalSender = config.senderEmail;
                        const originalSenderName = config.senderName;
                        const originalLimitPerHour = config.limitPerHour;
                        const originalLimitPerDay = config.limitPerDay;
                        config.senderEmail = spreadsheet.senderEmail;
                        config.senderName = spreadsheet.senderName;
                        if (spreadsheet.limitPerHour)
                            config.limitPerHour = spreadsheet.limitPerHour;
                        if (spreadsheet.limitPerDay)
                            config.limitPerDay = spreadsheet.limitPerDay;
                        const result = await gmailService.sendEmail(lead.email, lead.step3_subject, lead.step3_body, spreadsheet.googleAccessToken, spreadsheet.googleRefreshToken, {
                            threadId: config.useEmailThreads ? lead.step1_message_id : undefined,
                            inReplyTo: config.useEmailThreads ? lead.step1_message_id : undefined,
                        });
                        config.senderEmail = originalSender;
                        config.senderName = originalSenderName;
                        config.limitPerHour = originalLimitPerHour;
                        config.limitPerDay = originalLimitPerDay;
                        if (result.success) {
                            await sheetsService.updateLeadFieldsIn(spreadsheet.spreadsheetId, spreadsheet.sheetName, lead.rowIndex, {
                                status: 'zakończone',
                                step3_sent_date: now.toISOString(),
                                step3_message_id: result.messageId,
                            }, spreadsheet.googleAccessToken, spreadsheet.googleRefreshToken);
                            sent++;
                            console.log(`  ✅ Step 3 sent - Sequence complete!`);
                        }
                    }
                }
            }
            catch (error) {
                console.error(`  ❌ Error sending to ${lead.email}:`, error);
            }
        }
        return sent;
    }
    catch (error) {
        console.error(`❌ Error in processSendingForSpreadsheet:`, error);
        return 0;
    }
}
// Check replies for all active spreadsheets
export async function checkAllReplies() {
    try {
        console.log('\n📬 === CHECKING REPLIES (MULTI-SPREADSHEET) ===');
        const spreadsheets = await spreadsheetStorage.getActiveSpreadsheets();
        if (spreadsheets.length === 0) {
            console.log('No active spreadsheets');
            return 0;
        }
        let totalReplies = 0;
        for (const spreadsheet of spreadsheets) {
            console.log(`\n📚 Checking spreadsheet: ${spreadsheet.name}`);
            const replies = await checkRepliesForSpreadsheet(spreadsheet);
            totalReplies += replies;
        }
        console.log(`\n✅ Total replies found: ${totalReplies}`);
        return totalReplies;
    }
    catch (error) {
        console.error('❌ Error in checkAllReplies:', error);
        return 0;
    }
}
// Check replies for specific spreadsheet
async function checkRepliesForSpreadsheet(spreadsheet) {
    try {
        // Validate OAuth tokens
        if (!spreadsheet.googleAccessToken || !spreadsheet.googleRefreshToken) {
            console.log(`  ⚠️  Skipping ${spreadsheet.name} - missing OAuth tokens. Please authorize with Google.`);
            return 0;
        }
        const leads = await sheetsService.getLeadsToProcessFrom(spreadsheet.spreadsheetId, spreadsheet.sheetName, spreadsheet.googleAccessToken, spreadsheet.googleRefreshToken);
        const leadsWithEmails = leads.filter(lead => lead.step1_message_id && !lead.reply_received);
        if (leadsWithEmails.length === 0) {
            console.log(`  No leads to check in ${spreadsheet.name}`);
            return 0;
        }
        console.log(`  Checking ${leadsWithEmails.length} leads`);
        let repliesFound = 0;
        for (const lead of leadsWithEmails) {
            try {
                const hasReply = await gmailService.checkForReplies(lead.step1_message_id, lead.step1_message_id, spreadsheet.googleAccessToken, spreadsheet.googleRefreshToken);
                if (hasReply) {
                    console.log(`  📩 Reply received from ${lead.email}`);
                    await sheetsService.updateLeadFieldsIn(spreadsheet.spreadsheetId, spreadsheet.sheetName, lead.rowIndex, {
                        reply_received: true,
                        reply_date: new Date().toISOString(),
                        status: 'odpowiedź',
                    }, spreadsheet.googleAccessToken, spreadsheet.googleRefreshToken);
                    repliesFound++;
                }
                await sheetsService.updateLeadFieldsIn(spreadsheet.spreadsheetId, spreadsheet.sheetName, lead.rowIndex, {
                    last_check: new Date().toISOString(),
                }, spreadsheet.googleAccessToken, spreadsheet.googleRefreshToken);
            }
            catch (error) {
                console.error(`  ❌ Error checking ${lead.email}:`, error);
            }
        }
        return repliesFound;
    }
    catch (error) {
        console.error(`❌ Error in checkRepliesForSpreadsheet:`, error);
        return 0;
    }
}
// Main process all function
export async function processAll() {
    try {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 STARTING FULL PROCESS CYCLE (MULTI-SPREADSHEET)');
        console.log('⏰ Time:', new Date().toLocaleString('pl-PL', { timeZone: config.timezone }));
        console.log('='.repeat(60));
        await processAllResearch();
        await processAllSequenceGeneration();
        await processAllSending();
        await checkAllReplies();
        const stats = gmailService.getRateLimitStats();
        console.log('\n📊 Rate Limit Stats:');
        console.log(`  Hourly: ${stats.hourly.count}/${config.limitPerHour}`);
        console.log(`  Daily: ${stats.daily.count}/${config.limitPerDay}`);
        console.log('\n' + '='.repeat(60));
        console.log('✅ PROCESS CYCLE COMPLETE');
        console.log('='.repeat(60) + '\n');
    }
    catch (error) {
        console.error('❌ Error in processAll:', error);
    }
}
export default {
    processAllResearch,
    processAllSequenceGeneration,
    processAllSending,
    checkAllReplies,
    processAll,
};
//# sourceMappingURL=processor-multi.service.js.map