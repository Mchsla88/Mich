import { Lead, ResearchResult, EmailSequence } from '../types.js';
import * as sheetsService from './sheets.service.js';
import * as gmailService from './gmail.service.js';
import * as researchService from './research.service.js';
import * as sequenceService from './sequence.service.js';
import config from '../config.js';

// Process leads that need research
export async function processResearch(): Promise<number> {
  try {
    console.log('\n🔍 === PROCESSING RESEARCH ===');

    const leads = await sheetsService.getLeadsToProcess();
    const leadsNeedingResearch = leads.filter(
      lead => lead.status === 'nowy' && !lead.research_notes
    );

    if (leadsNeedingResearch.length === 0) {
      console.log('No leads needing research');
      return 0;
    }

    console.log(`Found ${leadsNeedingResearch.length} leads needing research`);

    let processed = 0;

    for (const lead of leadsNeedingResearch.slice(0, config.maxLeadsPerDay)) {
      try {
        console.log(`\n📊 Researching: ${lead.firma} (${lead.email})`);

        // Update status to 'research'
        await sheetsService.updateLeadFields(lead.rowIndex, {
          status: 'research',
        });

        // Perform research
        const researchResult: ResearchResult = await researchService.performResearch(
          lead.firma,
          lead.website_url,
          lead.imie
        );

        // Save research results
        await sheetsService.updateLeadFields(lead.rowIndex, {
          research_notes: JSON.stringify(researchResult),
          research_sources: researchResult.sources.join(', '),
          research_date: new Date().toISOString(),
        });

        console.log(`✅ Research completed for ${lead.firma}`);
        processed++;

        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error(`❌ Error processing research for ${lead.email}:`, error);
      }
    }

    console.log(`\n✅ Processed ${processed} research tasks`);
    return processed;
  } catch (error) {
    console.error('❌ Error in processResearch:', error);
    return 0;
  }
}

// Process leads that need sequence generation
export async function processSequenceGeneration(): Promise<number> {
  try {
    console.log('\n📧 === PROCESSING SEQUENCE GENERATION ===');

    const leads = await sheetsService.getLeadsToProcess();
    const leadsNeedingSequence = leads.filter(
      lead =>
        lead.research_notes &&
        !lead.step1_subject &&
        lead.status !== 'sekwencja' &&
        lead.status !== 'wysłane'
    );

    if (leadsNeedingSequence.length === 0) {
      console.log('No leads needing sequence generation');
      return 0;
    }

    console.log(`Found ${leadsNeedingSequence.length} leads needing sequence generation`);

    let processed = 0;

    for (const lead of leadsNeedingSequence) {
      try {
        console.log(`\n✉️  Generating sequence: ${lead.firma} (${lead.email})`);

        // Parse research notes
        const researchResult: ResearchResult = JSON.parse(lead.research_notes!);

        // Generate sequence
        const sequence: EmailSequence = await sequenceService.generateSequence(
          lead.firma,
          lead.website_url,
          lead.imie,
          researchResult
        );

        // Save sequence to sheet
        await sheetsService.updateLeadFields(lead.rowIndex, {
          status: 'sekwencja',
          step1_subject: sequence.steps[0].subject,
          step1_body: sequence.steps[0].body_html,
          step2_subject: sequence.steps[1].subject,
          step2_body: sequence.steps[1].body_html,
          step3_subject: sequence.steps[2].subject,
          step3_body: sequence.steps[2].body_html,
        });

        console.log(`✅ Sequence generated for ${lead.firma}`);
        processed++;

        // Add small delay
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error(`❌ Error generating sequence for ${lead.email}:`, error);
      }
    }

    console.log(`\n✅ Processed ${processed} sequence generations`);
    return processed;
  } catch (error) {
    console.error('❌ Error in processSequenceGeneration:', error);
    return 0;
  }
}

// Process sending emails
export async function processSending(): Promise<number> {
  try {
    console.log('\n📤 === PROCESSING SENDING ===');

    const leads = await sheetsService.getLeadsToProcess();
    const now = new Date();

    let sent = 0;

    for (const lead of leads) {
      // Skip if reply received
      if (lead.reply_received) {
        continue;
      }

      // Check if sequence is ready
      if (!lead.step1_subject || !lead.step1_body) {
        continue;
      }

      try {
        // Step 1: Send if not sent yet
        if (!lead.step1_sent_date) {
          console.log(`\n📨 Sending Step 1 to ${lead.email} (${lead.firma})`);

          const result = await gmailService.sendEmail(
            lead.email,
            lead.step1_subject!,
            lead.step1_body!
          );

          if (result.success) {
            await sheetsService.updateLeadFields(lead.rowIndex, {
              status: 'wysłane',
              step1_sent_date: now.toISOString(),
              step1_message_id: result.messageId,
            });
            sent++;
            console.log(`✅ Step 1 sent to ${lead.email}`);
          } else {
            console.log(`❌ Failed to send Step 1 to ${lead.email}: ${result.error}`);
          }

          continue;
        }

        // Step 2: Send if Step 1 sent + delay passed
        if (lead.step1_sent_date && !lead.step2_sent_date && lead.step2_subject) {
          const step1Date = new Date(lead.step1_sent_date);
          const daysSinceStep1 = (now.getTime() - step1Date.getTime()) / (1000 * 60 * 60 * 24);

          if (daysSinceStep1 >= config.step2DelayDays) {
            console.log(`\n📨 Sending Step 2 to ${lead.email} (${lead.firma})`);

            // Get thread ID from step 1
            const threadId = lead.step1_message_id;

            const result = await gmailService.sendEmail(
              lead.email,
              lead.step2_subject!,
              lead.step2_body!,
              {
                threadId: config.useEmailThreads ? threadId : undefined,
                inReplyTo: config.useEmailThreads ? lead.step1_message_id : undefined,
              }
            );

            if (result.success) {
              await sheetsService.updateLeadFields(lead.rowIndex, {
                step2_sent_date: now.toISOString(),
                step2_message_id: result.messageId,
              });
              sent++;
              console.log(`✅ Step 2 sent to ${lead.email}`);
            } else {
              console.log(`❌ Failed to send Step 2 to ${lead.email}: ${result.error}`);
            }

            continue;
          }
        }

        // Step 3: Send if Step 1 sent + delay passed
        if (lead.step1_sent_date && !lead.step3_sent_date && lead.step3_subject) {
          const step1Date = new Date(lead.step1_sent_date);
          const daysSinceStep1 = (now.getTime() - step1Date.getTime()) / (1000 * 60 * 60 * 24);

          if (daysSinceStep1 >= config.step3DelayDays) {
            console.log(`\n📨 Sending Step 3 to ${lead.email} (${lead.firma})`);

            // Get thread ID from step 1
            const threadId = lead.step1_message_id;

            const result = await gmailService.sendEmail(
              lead.email,
              lead.step3_subject!,
              lead.step3_body!,
              {
                threadId: config.useEmailThreads ? threadId : undefined,
                inReplyTo: config.useEmailThreads ? lead.step1_message_id : undefined,
              }
            );

            if (result.success) {
              await sheetsService.updateLeadFields(lead.rowIndex, {
                status: 'zakończone',
                step3_sent_date: now.toISOString(),
                step3_message_id: result.messageId,
              });
              sent++;
              console.log(`✅ Step 3 sent to ${lead.email} - Sequence complete!`);
            } else {
              console.log(`❌ Failed to send Step 3 to ${lead.email}: ${result.error}`);
            }

            continue;
          }
        }
      } catch (error: any) {
        console.error(`❌ Error sending to ${lead.email}:`, error);
      }
    }

    console.log(`\n✅ Sent ${sent} emails`);
    return sent;
  } catch (error) {
    console.error('❌ Error in processSending:', error);
    return 0;
  }
}

// Check for replies
export async function checkReplies(): Promise<number> {
  try {
    console.log('\n📬 === CHECKING REPLIES ===');

    const leads = await sheetsService.getLeadsToProcess();
    const leadsWithEmails = leads.filter(
      lead => lead.step1_message_id && !lead.reply_received
    );

    if (leadsWithEmails.length === 0) {
      console.log('No leads to check for replies');
      return 0;
    }

    console.log(`Checking ${leadsWithEmails.length} leads for replies`);

    const emailThreadPairs = leadsWithEmails
      .filter(lead => lead.step1_message_id)
      .map(lead => ({
        email: lead.email,
        threadId: lead.step1_message_id!,
        messageId: lead.step1_message_id!,
        rowIndex: lead.rowIndex,
      }));

    let repliesFound = 0;

    for (const pair of emailThreadPairs) {
      try {
        const hasReply = await gmailService.checkForReplies(
          pair.messageId,
          pair.threadId
        );

        if (hasReply) {
          console.log(`📩 Reply received from ${pair.email}`);

          await sheetsService.updateLeadFields(pair.rowIndex, {
            reply_received: true,
            reply_date: new Date().toISOString(),
            status: 'odpowiedź',
          });

          repliesFound++;
        }

        await sheetsService.updateLeadFields(pair.rowIndex, {
          last_check: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`❌ Error checking reply for ${pair.email}:`, error);
      }
    }

    console.log(`\n✅ Found ${repliesFound} replies`);
    return repliesFound;
  } catch (error) {
    console.error('❌ Error in checkReplies:', error);
    return 0;
  }
}

// Main processing function
export async function processAll(): Promise<void> {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 STARTING FULL PROCESS CYCLE');
    console.log('⏰ Time:', new Date().toLocaleString('pl-PL', { timeZone: config.timezone }));
    console.log('='.repeat(60));

    // Step 1: Research
    await processResearch();

    // Step 2: Generate sequences
    await processSequenceGeneration();

    // Step 3: Send emails
    await processSending();

    // Step 4: Check replies
    await checkReplies();

    // Show rate limit stats
    const stats = gmailService.getRateLimitStats();
    console.log('\n📊 Rate Limit Stats:');
    console.log(`  Hourly: ${stats.hourly.count}/${config.limitPerHour}`);
    console.log(`  Daily: ${stats.daily.count}/${config.limitPerDay}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ PROCESS CYCLE COMPLETE');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('❌ Error in processAll:', error);
  }
}

export default {
  processResearch,
  processSequenceGeneration,
  processSending,
  checkReplies,
  processAll,
};
