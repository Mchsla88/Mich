import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
const SPREADSHEETS_FILE = path.join(process.cwd(), 'data', 'spreadsheets.json');
// Ensure data directory exists
async function ensureDataDir() {
    const dataDir = path.dirname(SPREADSHEETS_FILE);
    try {
        await fs.access(dataDir);
    }
    catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}
// Load all spreadsheets
export async function loadSpreadsheets() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(SPREADSHEETS_FILE, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        // Return empty array if file doesn't exist
        return [];
    }
}
// Save all spreadsheets
export async function saveSpreadsheets(spreadsheets) {
    try {
        await ensureDataDir();
        await fs.writeFile(SPREADSHEETS_FILE, JSON.stringify(spreadsheets, null, 2), 'utf-8');
        console.log('✅ Spreadsheets config saved');
    }
    catch (error) {
        console.error('❌ Error saving spreadsheets config:', error);
        throw error;
    }
}
// Get active spreadsheets only
export async function getActiveSpreadsheets() {
    const all = await loadSpreadsheets();
    return all.filter(s => s.active);
}
// Get specific spreadsheet by ID
export async function getSpreadsheetById(id) {
    const all = await loadSpreadsheets();
    return all.find(s => s.id === id) || null;
}
// Add new spreadsheet
export async function addSpreadsheet(spreadsheet) {
    const spreadsheets = await loadSpreadsheets();
    const newSpreadsheet = {
        ...spreadsheet,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    spreadsheets.push(newSpreadsheet);
    await saveSpreadsheets(spreadsheets);
    console.log(`✅ Added spreadsheet: ${newSpreadsheet.name} (${newSpreadsheet.id})`);
    return newSpreadsheet;
}
// Update existing spreadsheet
export async function updateSpreadsheet(id, updates) {
    const spreadsheets = await loadSpreadsheets();
    const index = spreadsheets.findIndex(s => s.id === id);
    if (index === -1) {
        return null;
    }
    spreadsheets[index] = {
        ...spreadsheets[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    await saveSpreadsheets(spreadsheets);
    console.log(`✅ Updated spreadsheet: ${spreadsheets[index].name} (${id})`);
    return spreadsheets[index];
}
// Delete spreadsheet
export async function deleteSpreadsheet(id) {
    const spreadsheets = await loadSpreadsheets();
    const filtered = spreadsheets.filter(s => s.id !== id);
    if (filtered.length === spreadsheets.length) {
        return false; // Not found
    }
    await saveSpreadsheets(filtered);
    console.log(`✅ Deleted spreadsheet: ${id}`);
    return true;
}
// Toggle active status
export async function toggleSpreadsheetActive(id) {
    const spreadsheet = await getSpreadsheetById(id);
    if (!spreadsheet) {
        return null;
    }
    return updateSpreadsheet(id, { active: !spreadsheet.active });
}
export default {
    loadSpreadsheets,
    saveSpreadsheets,
    getActiveSpreadsheets,
    getSpreadsheetById,
    addSpreadsheet,
    updateSpreadsheet,
    deleteSpreadsheet,
    toggleSpreadsheetActive,
};
//# sourceMappingURL=spreadsheet.storage.js.map