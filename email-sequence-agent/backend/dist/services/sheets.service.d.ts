import { Lead } from '../types.js';
export declare function initGoogleAuth(): Promise<null>;
export declare function getLeads(): Promise<Lead[]>;
export declare function getLeadsToProcess(): Promise<Lead[]>;
export declare function updateLead(lead: Lead): Promise<void>;
export declare function updateLeadFields(rowIndex: number, updates: Partial<Lead>): Promise<void>;
export declare function getLeadsFrom(spreadsheetId: string, sheetName: string, accessToken: string, refreshToken: string): Promise<Lead[]>;
export declare function getLeadsToProcessFrom(spreadsheetId: string, sheetName: string, accessToken: string, refreshToken: string): Promise<Lead[]>;
export declare function updateLeadFieldsIn(spreadsheetId: string, sheetName: string, rowIndex: number, updates: Partial<Lead>, accessToken: string, refreshToken: string): Promise<void>;
declare const _default: {
    initGoogleAuth: typeof initGoogleAuth;
    getLeads: typeof getLeads;
    getLeadsToProcess: typeof getLeadsToProcess;
    updateLead: typeof updateLead;
    updateLeadFields: typeof updateLeadFields;
    getLeadsFrom: typeof getLeadsFrom;
    getLeadsToProcessFrom: typeof getLeadsToProcessFrom;
    updateLeadFieldsIn: typeof updateLeadFieldsIn;
};
export default _default;
//# sourceMappingURL=sheets.service.d.ts.map