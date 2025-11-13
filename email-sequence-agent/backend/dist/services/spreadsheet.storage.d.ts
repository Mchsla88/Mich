import { SpreadsheetConfig } from '../types.js';
export declare function loadSpreadsheets(): Promise<SpreadsheetConfig[]>;
export declare function saveSpreadsheets(spreadsheets: SpreadsheetConfig[]): Promise<void>;
export declare function getActiveSpreadsheets(): Promise<SpreadsheetConfig[]>;
export declare function getSpreadsheetById(id: string): Promise<SpreadsheetConfig | null>;
export declare function addSpreadsheet(spreadsheet: Omit<SpreadsheetConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<SpreadsheetConfig>;
export declare function updateSpreadsheet(id: string, updates: Partial<Omit<SpreadsheetConfig, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SpreadsheetConfig | null>;
export declare function deleteSpreadsheet(id: string): Promise<boolean>;
export declare function toggleSpreadsheetActive(id: string): Promise<SpreadsheetConfig | null>;
declare const _default: {
    loadSpreadsheets: typeof loadSpreadsheets;
    saveSpreadsheets: typeof saveSpreadsheets;
    getActiveSpreadsheets: typeof getActiveSpreadsheets;
    getSpreadsheetById: typeof getSpreadsheetById;
    addSpreadsheet: typeof addSpreadsheet;
    updateSpreadsheet: typeof updateSpreadsheet;
    deleteSpreadsheet: typeof deleteSpreadsheet;
    toggleSpreadsheetActive: typeof toggleSpreadsheetActive;
};
export default _default;
//# sourceMappingURL=spreadsheet.storage.d.ts.map