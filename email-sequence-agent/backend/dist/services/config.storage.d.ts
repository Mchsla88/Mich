interface RuntimeConfig {
    anthropicApiKey?: string;
    googleSpreadsheetId?: string;
    googleSheetName?: string;
    senderEmail?: string;
    senderName?: string;
    testEmail?: string;
    dryRun?: boolean;
    limitPerHour?: number;
    limitPerDay?: number;
}
export declare function loadRuntimeConfig(): Promise<RuntimeConfig>;
export declare function saveRuntimeConfig(config: RuntimeConfig): Promise<void>;
export declare function getConfigValue(key: keyof RuntimeConfig): Promise<any>;
export declare function setConfigValue(key: keyof RuntimeConfig, value: any): Promise<void>;
export declare function updateConfig(updates: Partial<RuntimeConfig>): Promise<RuntimeConfig>;
declare const _default: {
    loadRuntimeConfig: typeof loadRuntimeConfig;
    saveRuntimeConfig: typeof saveRuntimeConfig;
    getConfigValue: typeof getConfigValue;
    setConfigValue: typeof setConfigValue;
    updateConfig: typeof updateConfig;
};
export default _default;
//# sourceMappingURL=config.storage.d.ts.map