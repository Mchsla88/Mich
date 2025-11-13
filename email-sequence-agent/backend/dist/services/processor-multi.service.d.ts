export declare function processAllResearch(): Promise<{
    processed: number;
    errors: string[];
}>;
export declare function processAllSequenceGeneration(): Promise<number>;
export declare function processAllSending(): Promise<number>;
export declare function checkAllReplies(): Promise<number>;
export declare function processAll(): Promise<{
    researchProcessed: number;
    sequencesGenerated: number;
    emailsSent: number;
    repliesFound: number;
    errors: string[];
}>;
declare const _default: {
    processAllResearch: typeof processAllResearch;
    processAllSequenceGeneration: typeof processAllSequenceGeneration;
    processAllSending: typeof processAllSending;
    checkAllReplies: typeof checkAllReplies;
    processAll: typeof processAll;
};
export default _default;
//# sourceMappingURL=processor-multi.service.d.ts.map