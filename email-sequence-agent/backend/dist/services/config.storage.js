import fs from 'fs/promises';
import path from 'path';
const CONFIG_FILE = path.join(process.cwd(), 'data', 'runtime-config.json');
// Ensure data directory exists
async function ensureDataDir() {
    const dataDir = path.dirname(CONFIG_FILE);
    try {
        await fs.access(dataDir);
    }
    catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}
// Load runtime config
export async function loadRuntimeConfig() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        // Return empty config if file doesn't exist
        return {};
    }
}
// Save runtime config
export async function saveRuntimeConfig(config) {
    try {
        await ensureDataDir();
        await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
        console.log('✅ Runtime config saved');
    }
    catch (error) {
        console.error('❌ Error saving runtime config:', error);
        throw error;
    }
}
// Get specific config value
export async function getConfigValue(key) {
    const config = await loadRuntimeConfig();
    return config[key];
}
// Set specific config value
export async function setConfigValue(key, value) {
    const config = await loadRuntimeConfig();
    config[key] = value;
    await saveRuntimeConfig(config);
}
// Update config (merge)
export async function updateConfig(updates) {
    const config = await loadRuntimeConfig();
    const newConfig = { ...config, ...updates };
    await saveRuntimeConfig(newConfig);
    return newConfig;
}
export default {
    loadRuntimeConfig,
    saveRuntimeConfig,
    getConfigValue,
    setConfigValue,
    updateConfig,
};
//# sourceMappingURL=config.storage.js.map