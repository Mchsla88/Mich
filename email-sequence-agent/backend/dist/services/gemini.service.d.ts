import { EmailSequence, ResearchResult } from '../types.js';
export declare function performResearch(websiteUrl: string, apiKey: string): Promise<ResearchResult>;
export declare function generateSequence(firma: string, websiteUrl: string, imie: string, researchResult: ResearchResult, apiKey: string, customSignature?: string): Promise<EmailSequence>;
declare const _default: {
    performResearch: typeof performResearch;
    generateSequence: typeof generateSequence;
};
export default _default;
//# sourceMappingURL=gemini.service.d.ts.map