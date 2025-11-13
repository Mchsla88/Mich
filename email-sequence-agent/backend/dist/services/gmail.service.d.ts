import { GmailSendResult, RateLimiterState } from '../types.js';
export declare function getRateLimitStats(): RateLimiterState;
export declare function sendEmail(to: string, subject: string, bodyHtml: string, accessToken: string, refreshToken: string, options?: {
    threadId?: string;
    inReplyTo?: string;
    dryRun?: boolean;
}): Promise<GmailSendResult>;
export declare function checkForReplies(messageId: string, threadId: string, accessToken: string, refreshToken: string): Promise<boolean>;
export declare function searchThreadsByEmail(email: string, accessToken: string, refreshToken: string): Promise<string[]>;
export declare function checkAllReplies(emailThreadPairs: Array<{
    email: string;
    threadId: string;
    messageId: string;
}>, accessToken: string, refreshToken: string): Promise<Array<{
    email: string;
    hasReply: boolean;
}>>;
declare const _default: {
    sendEmail: typeof sendEmail;
    checkForReplies: typeof checkForReplies;
    searchThreadsByEmail: typeof searchThreadsByEmail;
    checkAllReplies: typeof checkAllReplies;
    getRateLimitStats: typeof getRateLimitStats;
};
export default _default;
//# sourceMappingURL=gmail.service.d.ts.map