import { google } from 'googleapis';
import { GmailSendResult, RateLimiterState } from '../types.js';
import config from '../config.js';

const gmail = google.gmail('v3');

// Rate limiter state
let rateLimiter: RateLimiterState = {
  hourly: {
    count: 0,
    resetAt: new Date(Date.now() + 60 * 60 * 1000),
  },
  daily: {
    count: 0,
    resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
};

// Check if within sending hours
function isWithinSendingHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Check weekends
  if (!config.sendWeekends && (day === 0 || day === 6)) {
    return false;
  }

  // Check hours
  return hour >= config.sendHourStart && hour < config.sendHourEnd;
}

// Check rate limits
function checkRateLimits(): { allowed: boolean; reason?: string } {
  const now = new Date();

  // Reset hourly if needed
  if (now >= rateLimiter.hourly.resetAt) {
    rateLimiter.hourly = {
      count: 0,
      resetAt: new Date(now.getTime() + 60 * 60 * 1000),
    };
  }

  // Reset daily if needed
  if (now >= rateLimiter.daily.resetAt) {
    rateLimiter.daily = {
      count: 0,
      resetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    };
  }

  // Check limits
  if (rateLimiter.hourly.count >= config.limitPerHour) {
    return {
      allowed: false,
      reason: `Hourly limit reached (${config.limitPerHour}/hour)`,
    };
  }

  if (rateLimiter.daily.count >= config.limitPerDay) {
    return {
      allowed: false,
      reason: `Daily limit reached (${config.limitPerDay}/day)`,
    };
  }

  return { allowed: true };
}

// Increment rate limits
function incrementRateLimits(): void {
  rateLimiter.hourly.count++;
  rateLimiter.daily.count++;
}

// Get current rate limit stats
export function getRateLimitStats(): RateLimiterState {
  return { ...rateLimiter };
}

// Create email with proper encoding for Polish characters
function createEmail(
  to: string,
  subject: string,
  bodyHtml: string,
  threadId?: string,
  inReplyTo?: string
): string {
  const from = config.senderName
    ? `${config.senderName} <${config.senderEmail}>`
    : config.senderEmail;

  const replyTo = config.replyToEmail || config.senderEmail;

  // Ensure proper UTF-8 encoding for Polish characters
  const utf8Subject = Buffer.from(subject, 'utf8').toString('utf8');

  let email = [
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `From: ${from}`,
    `To: ${to}`,
    `Reply-To: ${replyTo}`,
    `Subject: ${utf8Subject}`,
  ];

  // Add threading headers if this is a reply
  if (inReplyTo) {
    email.push(`In-Reply-To: ${inReplyTo}`);
    email.push(`References: ${inReplyTo}`);
  }

  email.push('');
  email.push(bodyHtml);

  return email.join('\r\n');
}

// Encode email to base64url
function encodeEmail(email: string): string {
  return Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Send email via Gmail API
export async function sendEmail(
  to: string,
  subject: string,
  bodyHtml: string,
  options: {
    threadId?: string;
    inReplyTo?: string;
    dryRun?: boolean;
  } = {}
): Promise<GmailSendResult> {
  try {
    // Check if within sending hours
    if (!isWithinSendingHours()) {
      return {
        success: false,
        error: `Outside sending hours (${config.sendHourStart}:00-${config.sendHourEnd}:00, Mon-Fri)`,
      };
    }

    // Check rate limits
    const rateLimitCheck = checkRateLimits();
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.reason,
      };
    }

    // Handle dry run mode
    const isDryRun = options.dryRun ?? config.dryRun;
    const actualTo = isDryRun && config.testEmail ? config.testEmail : to;

    if (isDryRun && config.testEmail) {
      console.log(`🧪 DRY RUN: Would send to ${to}, but sending to ${config.testEmail} instead`);
    }

    // Create email message
    const emailMessage = createEmail(
      actualTo,
      subject,
      bodyHtml,
      options.threadId,
      options.inReplyTo
    );

    const encodedEmail = encodeEmail(emailMessage);

    // Send via Gmail API
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
        threadId: options.threadId,
      },
    });

    // Increment rate limits
    incrementRateLimits();

    console.log(`✅ Email sent to ${actualTo} (Message ID: ${response.data.id})`);

    return {
      success: true,
      messageId: response.data.id || undefined,
      threadId: response.data.threadId || undefined,
    };
  } catch (error: any) {
    console.error(`❌ Error sending email to ${to}:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

// Check for replies to a specific message
export async function checkForReplies(
  messageId: string,
  threadId: string
): Promise<boolean> {
  try {
    // Get thread
    const thread = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
    });

    const messages = thread.data.messages || [];

    // Count messages - if more than sent, there's a reply
    // Note: This is simplified; in production you'd want to check sender
    const sentCount = messages.filter(msg =>
      msg.labelIds?.includes('SENT')
    ).length;

    const totalCount = messages.length;

    return totalCount > sentCount;
  } catch (error) {
    console.error(`❌ Error checking replies for message ${messageId}:`, error);
    return false;
  }
}

// Search for threads by recipient email
export async function searchThreadsByEmail(
  email: string
): Promise<string[]> {
  try {
    const response = await gmail.users.threads.list({
      userId: 'me',
      q: `to:${email}`,
    });

    const threads = response.data.threads || [];
    return threads.map(t => t.id!).filter(Boolean);
  } catch (error) {
    console.error(`❌ Error searching threads for ${email}:`, error);
    return [];
  }
}

// Check all threads for replies
export async function checkAllReplies(
  emailThreadPairs: Array<{ email: string; threadId: string; messageId: string }>
): Promise<Array<{ email: string; hasReply: boolean }>> {
  const results: Array<{ email: string; hasReply: boolean }> = [];

  for (const pair of emailThreadPairs) {
    const hasReply = await checkForReplies(pair.messageId, pair.threadId);
    results.push({
      email: pair.email,
      hasReply,
    });
  }

  return results;
}

export default {
  sendEmail,
  checkForReplies,
  searchThreadsByEmail,
  checkAllReplies,
  getRateLimitStats,
};
