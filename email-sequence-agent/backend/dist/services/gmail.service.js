import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import config from '../config.js';
// Create Gmail client with OAuth tokens
function getGmailClient(accessToken, refreshToken) {
    const oauth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3002/auth/google/callback');
    // Set credentials
    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
    });
    // Auto-refresh tokens when expired
    oauth2Client.on('tokens', (tokens) => {
        if (tokens.refresh_token) {
            console.log('🔄 New refresh token received');
        }
        if (tokens.access_token) {
            console.log('🔄 Access token refreshed');
        }
    });
    return google.gmail({ version: 'v1', auth: oauth2Client });
}
// Rate limiter state
let rateLimiter = {
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
function isWithinSendingHours() {
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
function checkRateLimits() {
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
function incrementRateLimits() {
    rateLimiter.hourly.count++;
    rateLimiter.daily.count++;
}
// Get current rate limit stats
export function getRateLimitStats() {
    return { ...rateLimiter };
}
// Create email with proper encoding for Polish characters
function createEmail(to, subject, bodyHtml, threadId, inReplyTo) {
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
function encodeEmail(email) {
    return Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
// Send email via Gmail API
export async function sendEmail(to, subject, bodyHtml, accessToken, refreshToken, options = {}) {
    try {
        // Validate tokens
        if (!accessToken || !refreshToken) {
            return {
                success: false,
                error: 'Missing OAuth tokens - please authorize with Google first',
            };
        }
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
        const emailMessage = createEmail(actualTo, subject, bodyHtml, options.threadId, options.inReplyTo);
        const encodedEmail = encodeEmail(emailMessage);
        // Send via Gmail API with OAuth tokens
        const gmail = getGmailClient(accessToken, refreshToken);
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
    }
    catch (error) {
        console.error(`❌ Error sending email to ${to}:`, error);
        return {
            success: false,
            error: error.message || 'Unknown error',
        };
    }
}
// Check for replies to a specific message
export async function checkForReplies(messageId, threadId, accessToken, refreshToken) {
    try {
        // Get thread
        const gmail = getGmailClient(accessToken, refreshToken);
        const thread = await gmail.users.threads.get({
            userId: 'me',
            id: threadId,
        });
        const messages = thread.data.messages || [];
        // Count messages - if more than sent, there's a reply
        // Note: This is simplified; in production you'd want to check sender
        const sentCount = messages.filter(msg => msg.labelIds?.includes('SENT')).length;
        const totalCount = messages.length;
        return totalCount > sentCount;
    }
    catch (error) {
        console.error(`❌ Error checking replies for message ${messageId}:`, error);
        return false;
    }
}
// Search for threads by recipient email
export async function searchThreadsByEmail(email, accessToken, refreshToken) {
    try {
        const gmail = getGmailClient(accessToken, refreshToken);
        const response = await gmail.users.threads.list({
            userId: 'me',
            q: `to:${email}`,
        });
        const threads = response.data.threads || [];
        return threads.map(t => t.id).filter(Boolean);
    }
    catch (error) {
        console.error(`❌ Error searching threads for ${email}:`, error);
        return [];
    }
}
// Check all threads for replies
export async function checkAllReplies(emailThreadPairs, accessToken, refreshToken) {
    const results = [];
    for (const pair of emailThreadPairs) {
        const hasReply = await checkForReplies(pair.messageId, pair.threadId, accessToken, refreshToken);
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
//# sourceMappingURL=gmail.service.js.map