export declare function startScheduler(): void;
export declare function stopScheduler(): void;
export declare function runNow(): Promise<{
    researchProcessed: number;
    sequencesGenerated: number;
    emailsSent: number;
    repliesFound: number;
    errors: string[];
}>;
export declare function getStatus(): {
    running: boolean;
    isProcessing: boolean;
    cronExpression: string;
    intervalMinutes: number;
    timezone: string;
};
declare const _default: {
    startScheduler: typeof startScheduler;
    stopScheduler: typeof stopScheduler;
    runNow: typeof runNow;
    getStatus: typeof getStatus;
};
export default _default;
//# sourceMappingURL=scheduler.service.d.ts.map