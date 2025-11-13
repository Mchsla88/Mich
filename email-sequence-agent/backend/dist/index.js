import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';
// Load environment variables from backend/.env
// Use process.cwd() which is the directory from which the process was started
const envPath = path.join(process.cwd(), '.env');
const envExists = existsSync(envPath);
console.log('📁 Current working directory:', process.cwd());
console.log('📁 Loading .env from:', envPath);
console.log('📁 .env file exists:', envExists);
if (!envExists) {
    console.error('❌ .env file not found! Create it from .env.example');
    console.error('   Run: cp .env.example .env');
}
dotenv.config({ path: envPath });
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config, { updateConfig, getConfig } from './config.js';
import * as sheetsService from './services/sheets.service.js';
import * as gmailService from './services/gmail.service.js';
import * as schedulerService from './services/scheduler.service.js';
import * as processorService from './services/processor-multi.service.js';
import * as configStorage from './services/config.storage.js';
import * as spreadsheetStorage from './services/spreadsheet.storage.js';
const app = express();
// Middleware
app.use(express.json());
app.use(cookieParser());
// Session middleware (required for OAuth)
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: true, // IMPORTANT: must be true to create session before OAuth redirect
    cookie: {
        secure: false, // set to true if using HTTPS
        sameSite: 'lax', // CRITICAL: Required for OAuth redirects to work in modern browsers
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
}));
// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
// Passport serialization
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});
// Configure Google OAuth Strategy
console.log('🔐 Configuring Google OAuth...');
console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Missing');
console.log('  GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✓ Set' : '✗ Missing');
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Google OAuth credentials not configured. OAuth login will not work.');
    console.warn('   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file');
}
else {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3002/auth/google/callback',
    }, (accessToken, refreshToken, profile, done) => {
        // Return user data with tokens
        const userData = {
            profile,
            accessToken,
            refreshToken,
        };
        return done(null, userData);
    }));
    console.log('✅ Google OAuth strategy configured');
}
// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
// Initialize
async function initialize() {
    console.log('\n🚀 Email Sequence Agent - Starting...\n');
    console.log('Configuration:');
    console.log(`  Spreadsheet ID: ${config.googleSpreadsheetId}`);
    console.log(`  Sheet Name: ${config.googleSheetName}`);
    console.log(`  Sender: ${config.senderName} <${config.senderEmail}>`);
    console.log(`  Dry Run: ${config.dryRun}`);
    if (config.dryRun && config.testEmail) {
        console.log(`  Test Email: ${config.testEmail}`);
    }
    console.log(`  Limits: ${config.limitPerHour}/hour, ${config.limitPerDay}/day`);
    console.log(`  Sending Hours: ${config.sendHourStart}:00-${config.sendHourEnd}:00`);
    console.log(`  Weekends: ${config.sendWeekends ? 'Yes' : 'No'}`);
    console.log(`  Timezone: ${config.timezone}`);
    console.log(`  AI Model: ${config.aiModel}`);
    console.log('');
    // Initialize Google Auth (non-blocking)
    try {
        await sheetsService.initGoogleAuth();
        console.log('✅ Google Auth initialized successfully\n');
    }
    catch (error) {
        console.warn('⚠️  Google Auth not configured yet - configure credentials through dashboard\n');
    }
    // Start scheduler
    schedulerService.startScheduler();
    console.log('✅ Server initialization complete!\n');
}
// ======================
// OAUTH ENDPOINTS
// ======================
// Start OAuth flow - redirect to Google
app.get('/auth/google', (req, res, next) => {
    const spreadsheetId = req.query.spreadsheetId;
    if (!spreadsheetId) {
        return res.status(400).send('Missing spreadsheetId parameter');
    }
    // Store spreadsheetId in a cookie (will be sent back with callback)
    res.cookie('oauth_spreadsheet_id', spreadsheetId, {
        httpOnly: true,
        maxAge: 10 * 60 * 1000, // 10 minutes
        sameSite: 'lax', // Required for OAuth redirects to work in modern browsers
    });
    console.log(`🔐 Starting OAuth for spreadsheet ${spreadsheetId}`);
    console.log(`  Set cookie: oauth_spreadsheet_id=${spreadsheetId}`);
    passport.authenticate('google', {
        scope: [
            'profile',
            'email',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/spreadsheets',
        ],
        accessType: 'offline',
        prompt: 'consent', // Force consent to get refresh token
    })(req, res, next);
});
// OAuth callback - Google redirects here after user authorizes
app.get('/auth/google/callback', (req, res, next) => {
    console.log('\n🔐 OAuth callback hit - starting Passport authentication');
    console.log(`  Query params:`, req.query);
    console.log(`  Cookies received:`, req.cookies);
    console.log(`  Session ID:`, req.sessionID);
    passport.authenticate('google', {
        failureRedirect: '/',
        failureMessage: true
    })(req, res, next);
}, async (req, res) => {
    try {
        const user = req.user;
        // Get spreadsheetId from cookie
        const spreadsheetId = req.cookies.oauth_spreadsheet_id;
        console.log(`\n🔐 OAuth callback received`);
        console.log(`  User authenticated:`, !!user);
        console.log(`  User email:`, user?.profile?.emails?.[0]?.value);
        console.log(`  Access token present:`, !!user?.accessToken);
        console.log(`  Refresh token present:`, !!user?.refreshToken);
        console.log(`  Spreadsheet ID from cookie: ${spreadsheetId}`);
        console.log(`  All cookies:`, req.cookies);
        console.log(`  Session ID:`, req.sessionID);
        console.log(`  Session data:`, req.session);
        // Check if user was authenticated by Passport
        if (!user) {
            console.log('❌ No user object - Passport authentication failed!');
            return res.send(`
          <html>
            <body>
              <h1>❌ Błąd autoryzacji</h1>
              <p>Nie udało się uwierzytelnić z Google.</p>
              <p>Debug: Passport did not return user object</p>
              <p>Sprawdź czy credentials Google OAuth są poprawnie skonfigurowane w Google Cloud Console.</p>
              <a href="/">Wróć do dashboardu</a>
            </body>
          </html>
        `);
        }
        if (!spreadsheetId) {
            console.log('❌ No spreadsheetId found in cookie!');
            return res.send(`
          <html>
            <body>
              <h1>❌ Błąd</h1>
              <p>Brak ID arkusza. Spróbuj ponownie z dashboardu.</p>
              <p>Debug: cookie missing or expired</p>
              <a href="/">Wróć do dashboardu</a>
            </body>
          </html>
        `);
        }
        // Clear the cookie (one-time use)
        res.clearCookie('oauth_spreadsheet_id');
        // Save tokens to spreadsheet config
        const spreadsheet = await spreadsheetStorage.getSpreadsheetById(spreadsheetId);
        if (!spreadsheet) {
            return res.send(`
          <html>
            <body>
              <h1>❌ Błąd</h1>
              <p>Nie znaleziono kampanii o ID: ${spreadsheetId}</p>
              <a href="/">Wróć do dashboardu</a>
            </body>
          </html>
        `);
        }
        // Update spreadsheet with OAuth tokens
        await spreadsheetStorage.updateSpreadsheet(spreadsheetId, {
            googleAccessToken: user.accessToken,
            googleRefreshToken: user.refreshToken,
            googleTokenExpiry: Date.now() + 3600 * 1000, // 1 hour
            senderEmail: user.profile.emails?.[0]?.value || spreadsheet.senderEmail,
        });
        // Success page with auto-close
        res.send(`
        <html>
          <head>
            <style>
              body { font-family: Arial; text-align: center; padding: 50px; }
              .success { color: #28a745; font-size: 24px; }
              .info { color: #666; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="success">✅ Autoryzacja zakończona pomyślnie!</div>
            <p class="info">Konto Google zostało połączone z kampanią.</p>
            <p class="info">Email: <strong>${user.profile.emails?.[0]?.value}</strong></p>
            <p class="info">To okno zamknie się automatycznie za 3 sekundy...</p>
            <script>
              setTimeout(() => {
                window.close();
                window.location.href = '/';
              }, 3000);
            </script>
            <a href="/">Wróć do dashboardu</a>
          </body>
        </html>
      `);
    }
    catch (error) {
        console.error('OAuth callback error:', error);
        res.send(`
        <html>
          <body>
            <h1>❌ Błąd autoryzacji</h1>
            <p>${error.message}</p>
            <a href="/">Wróć do dashboardu</a>
          </body>
        </html>
      `);
    }
});
// TEST ENDPOINT - Mock callback that simulates Google redirect (bypasses Passport)
app.get('/test/oauth-callback-mock', async (req, res) => {
    try {
        const spreadsheetId = req.cookies.oauth_spreadsheet_id;
        console.log(`🧪 MOCK CALLBACK: Simulating Google callback`);
        console.log(`  Cookie value: ${spreadsheetId}`);
        console.log(`  All cookies:`, req.cookies);
        if (!spreadsheetId) {
            return res.json({
                success: false,
                error: 'No spreadsheetId cookie found'
            });
        }
        // Check if spreadsheet exists
        const spreadsheet = await spreadsheetStorage.getSpreadsheetById(spreadsheetId);
        if (!spreadsheet) {
            return res.json({
                success: false,
                error: `Spreadsheet ${spreadsheetId} not found`
            });
        }
        // Simulate OAuth tokens
        const fakeTokens = {
            googleAccessToken: 'mock-access-token-' + Date.now(),
            googleRefreshToken: 'mock-refresh-token-' + Date.now(),
            googleTokenExpiry: Date.now() + 3600 * 1000,
            senderEmail: 'mock-user@example.com'
        };
        // Save tokens
        await spreadsheetStorage.updateSpreadsheet(spreadsheetId, fakeTokens);
        // Clear cookie
        res.clearCookie('oauth_spreadsheet_id');
        console.log(`🧪 MOCK CALLBACK: Tokens saved, cookie cleared`);
        res.json({
            success: true,
            message: 'Mock OAuth callback successful',
            spreadsheet: {
                id: spreadsheet.id,
                name: spreadsheet.name,
                senderEmail: fakeTokens.senderEmail
            }
        });
    }
    catch (error) {
        console.error('🧪 MOCK CALLBACK: Error:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});
// TEST ENDPOINT - Simulate complete OAuth flow (for testing without real Google login)
app.get('/test/oauth-flow/:spreadsheetId', async (req, res) => {
    try {
        const spreadsheetId = req.params.spreadsheetId;
        console.log(`🧪 TEST: Simulating OAuth flow for spreadsheet ${spreadsheetId}`);
        // Check if spreadsheet exists
        const spreadsheet = await spreadsheetStorage.getSpreadsheetById(spreadsheetId);
        if (!spreadsheet) {
            return res.json({
                success: false,
                error: `Spreadsheet ${spreadsheetId} not found`
            });
        }
        // Simulate OAuth tokens (fake but valid format)
        const fakeTokens = {
            googleAccessToken: 'fake-access-token-' + Date.now(),
            googleRefreshToken: 'fake-refresh-token-' + Date.now(),
            googleTokenExpiry: Date.now() + 3600 * 1000, // 1 hour
            senderEmail: 'test@example.com'
        };
        console.log(`🧪 TEST: Saving fake tokens to spreadsheet`);
        console.log(`  Access Token: ${fakeTokens.googleAccessToken}`);
        console.log(`  Refresh Token: ${fakeTokens.googleRefreshToken}`);
        // Save tokens
        await spreadsheetStorage.updateSpreadsheet(spreadsheetId, fakeTokens);
        // Verify tokens were saved
        const updated = await spreadsheetStorage.getSpreadsheetById(spreadsheetId);
        console.log(`🧪 TEST: Tokens saved successfully`);
        console.log(`  Verified access token: ${updated?.googleAccessToken}`);
        console.log(`  Verified refresh token: ${updated?.googleRefreshToken}`);
        res.json({
            success: true,
            message: 'OAuth flow simulated successfully',
            spreadsheet: {
                id: updated?.id,
                name: updated?.name,
                hasAccessToken: !!updated?.googleAccessToken,
                hasRefreshToken: !!updated?.googleRefreshToken,
                senderEmail: updated?.senderEmail
            }
        });
    }
    catch (error) {
        console.error('🧪 TEST: Error simulating OAuth flow:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});
// Check OAuth status for a spreadsheet
app.get('/api/auth/status/:spreadsheetId', async (req, res) => {
    try {
        const { spreadsheetId } = req.params;
        const spreadsheet = await spreadsheetStorage.getSpreadsheetById(spreadsheetId);
        if (!spreadsheet) {
            return res.status(404).json({ success: false, error: 'Spreadsheet not found' });
        }
        const hasAuth = !!(spreadsheet.googleAccessToken && spreadsheet.googleRefreshToken);
        const isExpired = spreadsheet.googleTokenExpiry
            ? Date.now() > spreadsheet.googleTokenExpiry
            : true;
        res.json({
            success: true,
            hasAuth,
            isExpired,
            email: spreadsheet.senderEmail,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// ======================
// API ENDPOINTS
// ======================
// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        config: {
            dryRun: config.dryRun,
            spreadsheetId: config.googleSpreadsheetId,
            sheetName: config.googleSheetName,
        },
    });
});
// Get all leads
app.get('/api/leads', async (req, res) => {
    try {
        const leads = await sheetsService.getLeads();
        res.json({
            success: true,
            count: leads.length,
            leads,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Get leads to process
app.get('/api/leads/to-process', async (req, res) => {
    try {
        const leads = await sheetsService.getLeadsToProcess();
        res.json({
            success: true,
            count: leads.length,
            leads,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Get rate limit stats
app.get('/api/rate-limits', (req, res) => {
    const stats = gmailService.getRateLimitStats();
    res.json({
        success: true,
        stats: {
            hourly: {
                used: stats.hourly.count,
                limit: config.limitPerHour,
                resetAt: stats.hourly.resetAt,
            },
            daily: {
                used: stats.daily.count,
                limit: config.limitPerDay,
                resetAt: stats.daily.resetAt,
            },
        },
    });
});
// Get scheduler status
app.get('/api/scheduler/status', (req, res) => {
    const status = schedulerService.getStatus();
    res.json({
        success: true,
        status,
    });
});
// Start scheduler
app.post('/api/scheduler/start', (req, res) => {
    try {
        schedulerService.startScheduler();
        res.json({
            success: true,
            message: 'Scheduler started',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Stop scheduler
app.post('/api/scheduler/stop', (req, res) => {
    try {
        schedulerService.stopScheduler();
        res.json({
            success: true,
            message: 'Scheduler stopped',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Run now (manual trigger)
app.post('/api/scheduler/run-now', async (req, res) => {
    try {
        // Run in background
        schedulerService.runNow().catch(err => {
            console.error('Error in manual run:', err);
        });
        res.json({
            success: true,
            message: 'Manual run triggered',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Process research only
app.post('/api/process/research', async (req, res) => {
    try {
        const count = await processorService.processAllResearch();
        res.json({
            success: true,
            message: `Processed ${count} research tasks`,
            count,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Process sequence generation only
app.post('/api/process/sequences', async (req, res) => {
    try {
        const count = await processorService.processAllSequenceGeneration();
        res.json({
            success: true,
            message: `Generated ${count} sequences`,
            count,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Process sending only
app.post('/api/process/send', async (req, res) => {
    try {
        const count = await processorService.processAllSending();
        res.json({
            success: true,
            message: `Sent ${count} emails`,
            count,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Check replies only
app.post('/api/process/check-replies', async (req, res) => {
    try {
        const count = await processorService.checkAllReplies();
        res.json({
            success: true,
            message: `Found ${count} replies`,
            count,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// ======================
// CONFIGURATION ENDPOINTS
// ======================
// Get current configuration
app.get('/api/config', (req, res) => {
    const currentConfig = getConfig();
    // Don't expose sensitive data in full
    res.json({
        success: true,
        config: {
            googleSpreadsheetId: currentConfig.googleSpreadsheetId,
            googleSheetName: currentConfig.googleSheetName,
            senderEmail: currentConfig.senderEmail,
            senderName: currentConfig.senderName,
            testEmail: currentConfig.testEmail,
            dryRun: currentConfig.dryRun,
            limitPerHour: currentConfig.limitPerHour,
            limitPerDay: currentConfig.limitPerDay,
            sendHourStart: currentConfig.sendHourStart,
            sendHourEnd: currentConfig.sendHourEnd,
            sendWeekends: currentConfig.sendWeekends,
            aiModel: currentConfig.aiModel,
            anthropicApiKeySet: !!currentConfig.anthropicApiKey,
            timezone: currentConfig.timezone,
            cronIntervalMinutes: currentConfig.cronIntervalMinutes,
        },
    });
});
// Update configuration
app.post('/api/config', async (req, res) => {
    try {
        const updates = req.body;
        // Update runtime config
        updateConfig(updates);
        // Save to storage
        await configStorage.updateConfig(updates);
        res.json({
            success: true,
            message: 'Configuration updated',
            config: getConfig(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Update API key specifically
app.post('/api/config/api-key', async (req, res) => {
    try {
        const { anthropicApiKey } = req.body;
        if (!anthropicApiKey || typeof anthropicApiKey !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid API key',
            });
        }
        // Update runtime config
        updateConfig({ anthropicApiKey });
        // Save to storage
        await configStorage.setConfigValue('anthropicApiKey', anthropicApiKey);
        console.log('✅ Anthropic API key updated');
        res.json({
            success: true,
            message: 'API key updated successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// ======================
// SPREADSHEET MANAGEMENT ENDPOINTS
// ======================
// Get all spreadsheets
app.get('/api/spreadsheets', async (req, res) => {
    try {
        const spreadsheets = await spreadsheetStorage.loadSpreadsheets();
        res.json({
            success: true,
            count: spreadsheets.length,
            spreadsheets,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Get active spreadsheets only
app.get('/api/spreadsheets/active', async (req, res) => {
    try {
        const spreadsheets = await spreadsheetStorage.getActiveSpreadsheets();
        res.json({
            success: true,
            count: spreadsheets.length,
            spreadsheets,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Get specific spreadsheet
app.get('/api/spreadsheets/:id', async (req, res) => {
    try {
        const spreadsheet = await spreadsheetStorage.getSpreadsheetById(req.params.id);
        if (!spreadsheet) {
            return res.status(404).json({
                success: false,
                error: 'Spreadsheet not found',
            });
        }
        res.json({
            success: true,
            spreadsheet,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Add new spreadsheet
app.post('/api/spreadsheets', async (req, res) => {
    try {
        const { spreadsheetId, sheetName, senderEmail, senderName, replyToEmail, name, active, aiProvider, aiApiKey } = req.body;
        // Validation
        if (!spreadsheetId || !sheetName || !senderEmail || !senderName || !name) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: spreadsheetId, sheetName, senderEmail, senderName, name',
            });
        }
        const newSpreadsheet = await spreadsheetStorage.addSpreadsheet({
            spreadsheetId,
            sheetName,
            senderEmail,
            senderName,
            replyToEmail: replyToEmail || senderEmail,
            name,
            active: active !== undefined ? active : true,
            aiProvider: aiProvider || 'anthropic', // Default to anthropic
            aiApiKey: aiApiKey || undefined,
        });
        res.status(201).json({
            success: true,
            message: 'Spreadsheet added successfully',
            spreadsheet: newSpreadsheet,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Update spreadsheet
app.put('/api/spreadsheets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedSpreadsheet = await spreadsheetStorage.updateSpreadsheet(id, updates);
        if (!updatedSpreadsheet) {
            return res.status(404).json({
                success: false,
                error: 'Spreadsheet not found',
            });
        }
        res.json({
            success: true,
            message: 'Spreadsheet updated successfully',
            spreadsheet: updatedSpreadsheet,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Toggle spreadsheet active status
app.post('/api/spreadsheets/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const spreadsheet = await spreadsheetStorage.toggleSpreadsheetActive(id);
        if (!spreadsheet) {
            return res.status(404).json({
                success: false,
                error: 'Spreadsheet not found',
            });
        }
        res.json({
            success: true,
            message: `Spreadsheet ${spreadsheet.active ? 'activated' : 'deactivated'}`,
            spreadsheet,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Delete spreadsheet
app.delete('/api/spreadsheets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await spreadsheetStorage.deleteSpreadsheet(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Spreadsheet not found',
            });
        }
        res.json({
            success: true,
            message: 'Spreadsheet deleted successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Update spreadsheet
app.put('/api/spreadsheets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updated = await spreadsheetStorage.updateSpreadsheet(id, updates);
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Spreadsheet not found',
            });
        }
        res.json({
            success: true,
            spreadsheet: updated,
            message: 'Spreadsheet updated successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Upload Google credentials file
app.post('/api/credentials/upload', async (req, res) => {
    try {
        const { spreadsheetId, fileName, fileContent } = req.body;
        if (!spreadsheetId || !fileName || !fileContent) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: spreadsheetId, fileName, fileContent',
            });
        }
        // Validate fileName
        if (!fileName.endsWith('.json')) {
            return res.status(400).json({
                success: false,
                error: 'File must be a .json file',
            });
        }
        // Decode base64 content
        const fileBuffer = Buffer.from(fileContent, 'base64');
        // Validate JSON structure
        try {
            const jsonContent = JSON.parse(fileBuffer.toString('utf-8'));
            if (!jsonContent.type || jsonContent.type !== 'service_account') {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid Google Service Account JSON file',
                });
            }
        }
        catch (parseError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid JSON file format',
            });
        }
        // Save file to credentials folder with spreadsheet-specific name
        const fs = await import('fs');
        const path = await import('path');
        const credentialsDir = path.join(process.cwd(), 'credentials');
        // Create credentials directory if it doesn't exist
        if (!fs.existsSync(credentialsDir)) {
            fs.mkdirSync(credentialsDir, { recursive: true });
        }
        // Generate filename: credentials-{spreadsheetId}.json
        const safeFileName = `credentials-${spreadsheetId}.json`;
        const filePath = path.join(credentialsDir, safeFileName);
        // Write file
        fs.writeFileSync(filePath, fileBuffer);
        res.json({
            success: true,
            fileName: safeFileName,
            message: 'Credentials file uploaded successfully',
        });
    }
    catch (error) {
        console.error('Error uploading credentials:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Simple HTML dashboard
app.get('/', (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Sequence Agent - Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 30px;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
    }
    .section {
      margin-bottom: 30px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    h2 {
      color: #444;
      margin-bottom: 15px;
      font-size: 18px;
    }
    button {
      background: #0066cc;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin: 5px;
      transition: background 0.2s;
    }
    button:hover {
      background: #0052a3;
    }
    button.danger {
      background: #d32f2f;
    }
    button.danger:hover {
      background: #b71c1c;
    }
    button.success {
      background: #2e7d32;
    }
    button.success:hover {
      background: #1b5e20;
    }
    .status {
      padding: 15px;
      background: white;
      border-radius: 6px;
      margin-top: 15px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .info-card {
      background: white;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #0066cc;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }
    code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 13px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }
    .badge.active {
      background: #4caf50;
      color: white;
    }
    .badge.inactive {
      background: #9e9e9e;
      color: white;
    }
    .alert {
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .alert.warning {
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      color: #e65100;
    }
    .alert.info {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      color: #0d47a1;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #444;
      font-size: 14px;
    }
    input[type="text"],
    input[type="password"],
    input[type="email"] {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      font-family: monospace;
    }
    input:focus {
      outline: none;
      border-color: #0066cc;
    }
    .success-message {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
      padding: 12px;
      border-radius: 4px;
      margin-top: 10px;
      display: none;
    }
    .error-message {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
      padding: 12px;
      border-radius: 4px;
      margin-top: 10px;
      display: none;
    }
    .config-status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-left: 10px;
    }
    .config-status.ok {
      background: #d4edda;
      color: #155724;
    }
    .config-status.missing {
      background: #fff3cd;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📧 Email Sequence Agent</h1>
    <p class="subtitle">AI-Powered Email Automation System</p>

    ${config.dryRun ? `
    <div class="alert warning">
      <strong>⚠️ DRY RUN MODE</strong><br>
      Wszystkie emaile będą wysyłane na: <code>${config.testEmail || 'NOT SET'}</code>
    </div>
    ` : `
    <div class="alert info">
      <strong>🚀 PRODUCTION MODE</strong><br>
      Emaile są wysyłane do rzeczywistych adresatów!
    </div>
    `}

    ${!config.anthropicApiKey ? `
    <div class="alert warning">
      <strong>⚠️ BRAK API KEY</strong><br>
      Anthropic API key nie jest ustawiony! Ustaw go poniżej, aby system mógł działać.
    </div>
    ` : ''}

    <div class="section">
      <h2>📖 Instrukcja konfiguracji - Krok po kroku</h2>
      <button onclick="toggleInstructions()" style="margin-bottom: 15px; background: #17a2b8;">
        📚 Pokaż/Ukryj szczegółową instrukcję
      </button>

      <div id="instructionsPanel" style="display: none; background: white; padding: 20px; border-radius: 6px; border: 1px solid #ddd;">
        <h3 style="color: #0066cc; margin-top: 0;">🔐 Krok 1: Tworzenie Google Service Account (30 min)</h3>

        <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #0066cc; margin-bottom: 20px;">
          <p><strong>Co to jest Service Account?</strong></p>
          <p style="margin: 10px 0;">To specjalne konto Google które pozwala aplikacji automatycznie wysyłać emaile i zarządzać arkuszami bez logowania przez przeglądarkę.</p>
        </div>

        <ol style="line-height: 1.8;">
          <li><strong>Wejdź na Google Cloud Console:</strong><br>
            <a href="https://console.cloud.google.com/" target="_blank" style="color: #0066cc;">https://console.cloud.google.com/</a>
          </li>

          <li><strong>Utwórz nowy projekt:</strong><br>
            • Kliknij "Wybierz projekt" (góra strony)<br>
            • Kliknij "NOWY PROJEKT"<br>
            • Nazwa: np. "Email-Agent"<br>
            • Kliknij "UTWÓRZ"<br>
            • Poczekaj aż projekt się utworzy (może zająć minutę)
          </li>

          <li><strong>Włącz Gmail API:</strong><br>
            • W menu bocznym: "Interfejsy API i usługi" → "Biblioteka"<br>
            • Wyszukaj: "Gmail API"<br>
            • Kliknij na Gmail API<br>
            • Kliknij "WŁĄCZ" (niebieski przycisk)<br>
            • Poczekaj na włączenie
          </li>

          <li><strong>Włącz Google Sheets API:</strong><br>
            • Wróć do Biblioteki<br>
            • Wyszukaj: "Google Sheets API"<br>
            • Kliknij na Google Sheets API<br>
            • Kliknij "WŁĄCZ"
          </li>

          <li><strong>Utwórz Konto usługi (Service Account):</strong><br>
            • W menu bocznym: "Interfejsy API i usługi" → "Dane logowania"<br>
            • Kliknij "UTWÓRZ DANE LOGOWANIA" (góra strony)<br>
            • Wybierz "Konto usługi"<br>
            • Wypełnij formularz:<br>
            &nbsp;&nbsp;- Nazwa konta usługi: "email-agent"<br>
            &nbsp;&nbsp;- ID konta usługi: automatycznie<br>
            &nbsp;&nbsp;- Opis: "Email automation agent"<br>
            • Kliknij "UTWÓRZ I KONTYNUUJ"<br>
            • Rola: wybierz "Właściciel" (najprostsze)<br>
            • Kliknij "KONTYNUUJ"<br>
            • Kliknij "GOTOWE"
          </li>

          <li><strong>⭐ Pobierz plik JSON (NAJWAŻNIEJSZE!):</strong><br>
            • Na liście Kont usług znajdź swoje konto (email-agent@...)<br>
            • Kliknij na email konta usługi<br>
            • Przejdź do zakładki "KLUCZE"<br>
            • Kliknij "DODAJ KLUCZ" → "Utwórz nowy klucz"<br>
            • Wybierz "JSON"<br>
            • Kliknij "UTWÓRZ"<br>
            <strong style="color: #dc3545;">→ Plik JSON zostanie pobrany na Twój komputer!</strong><br>
            <strong>→ Zapisz go w bezpiecznym miejscu!</strong>
          </li>

          <li><strong>Włącz delegowanie w całej domenie (dla Gmail):</strong><br>
            • Wróć do listy Kont usług<br>
            • Kliknij na swoje konto<br>
            • Zaznacz checkbox "Włącz delegowanie w całej domenie G Suite"<br>
            • Kliknij "ZAPISZ"
          </li>
        </ol>

        <div style="background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
          <strong>✅ Gotowe!</strong> Masz teraz plik JSON z credentials!
        </div>

        <hr style="margin: 30px 0;">

        <h3 style="color: #0066cc;">🔑 Krok 2: Konfiguracja API Keys (5 min)</h3>

        <h4>A) Anthropic API Key (dla Claude AI):</h4>
        <ol style="line-height: 1.8;">
          <li>Wejdź na: <a href="https://console.anthropic.com/" target="_blank" style="color: #0066cc;">https://console.anthropic.com/</a></li>
          <li>Zarejestruj się lub zaloguj</li>
          <li>Kliknij "Get API Keys" lub "API Keys" w menu</li>
          <li>Kliknij "Create Key"</li>
          <li>Skopiuj klucz (zaczyna się od: sk-ant-api03-...)</li>
          <li>Wklej go w pole "Anthropic API Key" poniżej</li>
          <li>Kliknij "💾 Zapisz API Key"</li>
        </ol>

        <h4>B) Google Gemini API Key (opcjonalnie):</h4>
        <ol style="line-height: 1.8;">
          <li>Wejdź na: <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: #0066cc;">https://aistudio.google.com/app/apikey</a></li>
          <li>Zaloguj się kontem Google</li>
          <li>Kliknij "Create API Key"</li>
          <li>Skopiuj klucz</li>
          <li>Wklej go przy dodawaniu kampanii (jeśli chcesz używać Gemini)</li>
        </ol>

        <hr style="margin: 30px 0;">

        <h3 style="color: #0066cc;">📊 Krok 3: Przygotowanie Google Sheets (10 min)</h3>

        <ol style="line-height: 1.8;">
          <li><strong>Utwórz nowy Google Sheet lub otwórz istniejący</strong></li>

          <li><strong>Nazwa arkusza musi być: "Leads"</strong> (lub inna nazwa którą podasz w ustawieniach)</li>

          <li><strong>Skopiuj ID arkusza z URL:</strong><br>
            URL wygląda tak:<br>
            <code>https://docs.google.com/spreadsheets/d/<strong style="color: #dc3545;">TUTAJ_JEST_ID</strong>/edit</code><br>
            Przykład ID: <code>13CYoUh8BpVi4dOjeXrU1NFIt9PTVpKKhrdQGpggYzZ4</code>
          </li>

          <li><strong>Dodaj kolumny (dokładnie w tej kolejności!):</strong><br>
            A - email<br>
            B - firma<br>
            C - website_url<br>
            D - imie<br>
            E - generuj (TRUE/FALSE)<br>
            F - status<br>
            G - research_notes<br>
            ... (pozostałe 19 kolumn według dokumentacji)
          </li>

          <li><strong>⭐ NAJWAŻNIEJSZE - Nadaj dostęp dla Service Account:</strong><br>
            • Otwórz pobrany plik JSON w notatniku<br>
            • Znajdź linię: <code>"client_email": "email-agent@..."</code><br>
            • Skopiuj ten email (np. email-agent@projekt-123.iam.gserviceaccount.com)<br>
            • W Google Sheets kliknij przycisk "Udostępnij" (prawy górny róg)<br>
            • Wklej email Service Account<br>
            • Ustaw uprawnienia: <strong>"Edytor"</strong><br>
            • ODZNACZ "Powiadom osoby"<br>
            • Kliknij "Udostępnij"<br>
            <strong style="color: #dc3545;">→ Bez tego krok aplikacja NIE będzie mogła czytać/zapisywać!</strong>
          </li>
        </ol>

        <hr style="margin: 30px 0;">

        <h3 style="color: #0066cc;">🚀 Krok 4: Dodanie kampanii w aplikacji (5 min)</h3>

        <ol style="line-height: 1.8;">
          <li>Przewiń w dół do sekcji "📚 Zarządzanie Arkuszami"</li>
          <li>Kliknij "➕ Dodaj nowy arkusz"</li>
          <li>Wypełnij formularz:
            <ul>
              <li><strong>Google Spreadsheet ID:</strong> wklej ID z URL arkusza</li>
              <li><strong>Nazwa zakładki:</strong> "Leads" (lub inna nazwa)</li>
              <li><strong>Nazwa kampanii:</strong> np. "Kampania Web Design"</li>
              <li><strong>Email nadawcy:</strong> twój email z którego będą wysyłane wiadomości</li>
              <li><strong>Nazwa nadawcy:</strong> Twoje imię i nazwisko</li>
              <li><strong>Stopka email:</strong> kod HTML lub upload pliku .html</li>
              <li><strong>Limity:</strong> opcjonalnie (domyślnie 10/godz, 50/dzień)</li>
              <li><strong>Dostawca AI:</strong> Anthropic lub Gemini</li>
              <li><strong>Google Credentials JSON:</strong> wybierz pobrany plik JSON</li>
            </ul>
          </li>
          <li>Kliknij "💾 Dodaj arkusz"</li>
        </ol>

        <div style="background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
          <strong>🎉 Gotowe!</strong> System jest skonfigurowany i gotowy do pracy!
        </div>

        <hr style="margin: 30px 0;">

        <h3 style="color: #0066cc;">📝 Dodawanie leadów do arkusza</h3>

        <p>W Google Sheets dodaj leadów z wypełnionymi kolumnami:</p>
        <ul>
          <li><strong>email:</strong> adres email klienta</li>
          <li><strong>firma:</strong> nazwa firmy</li>
          <li><strong>website_url:</strong> https://strona-klienta.pl</li>
          <li><strong>imie:</strong> imię osoby kontaktowej</li>
          <li><strong>generuj:</strong> TRUE (żeby system przetworzył)</li>
          <li><strong>status:</strong> nowy</li>
        </ul>

        <p><strong>System automatycznie:</strong></p>
        <ol>
          <li>Wykona research strony WWW (analiza SEO, UX, performance)</li>
          <li>Wygeneruje 3-stopniową sekwencję emaili</li>
          <li>Wyśle emaile w odpowiednich odstępach czasu (0, +3, +7 dni)</li>
          <li>Będzie monitorował odpowiedzi</li>
        </ol>

        <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <strong>⚠️ Ważne!</strong><br>
          • DRY RUN mode: wszystkie emaile idą na test email (bezpieczne testowanie)<br>
          • PRODUCTION mode: emaile idą do rzeczywistych klientów<br>
          • Zmień tryb w pliku .env: DRY_RUN=true lub false
        </div>

        <hr style="margin: 30px 0;">

        <h3 style="color: #dc3545;">🆘 Najczęstsze problemy</h3>

        <details style="margin: 10px 0;">
          <summary style="cursor: pointer; font-weight: bold;">❌ "Failed to initialize Google Auth"</summary>
          <div style="padding: 10px; background: #f8f9fa;">
            <strong>Przyczyna:</strong> Brak pliku credentials JSON lub zły plik<br>
            <strong>Rozwiązanie:</strong>
            <ul>
              <li>Upewnij się że uploadowałeś poprawny plik JSON</li>
              <li>Sprawdź czy w pliku jest "type": "service_account"</li>
              <li>Pobierz nowy plik z Google Cloud Console</li>
            </ul>
          </div>
        </details>

        <details style="margin: 10px 0;">
          <summary style="cursor: pointer; font-weight: bold;">❌ "The caller does not have permission"</summary>
          <div style="padding: 10px; background: #f8f9fa;">
            <strong>Przyczyna:</strong> Service Account nie ma dostępu do arkusza<br>
            <strong>Rozwiązanie:</strong>
            <ul>
              <li>Otwórz Google Sheet</li>
              <li>Kliknij "Udostępnij"</li>
              <li>Dodaj email Service Account (z pliku JSON: client_email)</li>
              <li>Ustaw uprawnienia: "Edytor"</li>
            </ul>
          </div>
        </details>

        <details style="margin: 10px 0;">
          <summary style="cursor: pointer; font-weight: bold;">❌ System nie wysyła emaili</summary>
          <div style="padding: 10px; background: #f8f9fa;">
            <strong>Możliwe przyczyny:</strong>
            <ul>
              <li>Scheduler nie jest uruchomiony - kliknij "▶️ Start" w sekcji Scheduler</li>
              <li>Poza godzinami wysyłki (9:00-18:00)</li>
              <li>Osiągnięto limity (10/godz, 50/dzień)</li>
              <li>Status leadów nie jest odpowiedni</li>
              <li>Brak wygenerowanych sekwencji</li>
            </ul>
          </div>
        </details>
      </div>
    </div>

    <div class="section">
      <h2>🔑 API Configuration</h2>
      <p style="margin-bottom: 15px;">
        Anthropic API Key:
        <span class="config-status ${config.anthropicApiKey ? 'ok' : 'missing'}">
          ${config.anthropicApiKey ? '✓ Ustawiony' : '✗ Brak'}
        </span>
      </p>

      <div class="form-group">
        <label for="apiKey">🌍 Globalny Anthropic API Key (fallback dla kampanii bez własnego klucza)</label>
        <input
          type="password"
          id="apiKey"
          placeholder="sk-ant-api03-..."
          value="${config.anthropicApiKey ? '••••••••••••••••' : ''}"
        />
        <small style="color: #666;">
          <strong>Uwaga:</strong> Ten klucz jest używany TYLKO gdy kampania nie ma własnego klucza API.
          Możesz podać dedykowany klucz dla każdej kampanii osobno w formularzu edycji.
          Pobierz z: <a href="https://console.anthropic.com/" target="_blank">console.anthropic.com</a>
        </small>
      </div>

      <div class="form-group">
        <label for="testEmail">Test Email (dla DRY RUN)</label>
        <input
          type="email"
          id="testEmail"
          placeholder="twoj-email@example.com"
          value="${config.testEmail || ''}"
        />
      </div>

      <div>
        <button onclick="saveApiKey()">💾 Zapisz API Key</button>
        <button onclick="saveTestEmail()">💾 Zapisz Test Email</button>
      </div>

      <div id="configSuccess" class="success-message"></div>
      <div id="configError" class="error-message"></div>
    </div>

    <div class="section">
      <h2>📚 Zarządzanie Arkuszami</h2>
      <p style="margin-bottom: 15px;">Dodaj wiele arkuszy Google Sheets - każdy z osobnym emailem nadawcy dla różnych kampanii.</p>

      <div id="spreadsheetsList" style="margin-bottom: 20px;">
        <p style="color: #666;">Ładowanie...</p>
      </div>

      <button onclick="showAddSpreadsheetForm()">➕ Dodaj nowy arkusz</button>

      <div id="addSpreadsheetForm" style="display: none; margin-top: 20px; padding: 20px; background: white; border-radius: 6px; border: 1px solid #ddd;">
        <h3 style="margin-bottom: 15px; font-size: 16px;">Nowy arkusz</h3>

        <div class="form-group">
          <label for="newSpreadsheetId">Google Spreadsheet URL lub ID *</label>
          <input type="text" id="newSpreadsheetId" placeholder="Wklej cały URL: https://docs.google.com/spreadsheets/d/13CYoUh8BpVi.../edit lub samo ID" />
          <small style="color: #666;">
            Możesz wkleić <strong>cały URL arkusza</strong> (skopiuj z paska przeglądarki) lub samo ID.
            Aplikacja automatycznie wyciągnie ID z URLa.
          </small>
        </div>

        <div class="form-group">
          <label for="newSheetName">Nazwa zakładki *</label>
          <input type="text" id="newSheetName" placeholder="Leads" value="Leads" />
        </div>

        <div class="form-group">
          <label for="newSpreadsheetName">Nazwa kampanii *</label>
          <input type="text" id="newSpreadsheetName" placeholder="np. Kampania Web Design" />
        </div>

        <div class="form-group">
          <label for="newSenderEmail">Email nadawcy *</label>
          <input type="email" id="newSenderEmail" placeholder="email@example.com" />
        </div>

        <div class="form-group">
          <label for="newSenderName">Nazwa nadawcy *</label>
          <input type="text" id="newSenderName" placeholder="Imię Nazwisko" />
        </div>

        <div class="form-group">
          <label for="newSignature">Stopka email (HTML)</label>
          <textarea id="newSignature" rows="8" placeholder="<div>&#10;  <p><strong>Imię Nazwisko</strong></p>&#10;  <p>Email: email@example.com</p>&#10;</div>" style="font-family: monospace; font-size: 12px;"></textarea>
          <small style="color: #666;">Opcjonalne - kod HTML stopki. Jeśli puste, użyje domyślnej stopki.</small>
        </div>

        <div class="form-group">
          <label for="newSignatureFile">Lub załaduj stopkę z pliku HTML</label>
          <input type="file" id="newSignatureFile" accept=".html,.htm" onchange="handleSignatureFileSelect(event)" />
          <small style="color: #666;">Opcjonalne - plik HTML ze stopką email. Zastąpi zawartość pola powyżej.</small>
          <div id="signatureFileStatus" style="margin-top: 8px; font-size: 13px;"></div>
        </div>

        <div class="form-group">
          <label>Limity wysyłek</label>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label for="newLimitPerHour" style="font-size: 13px; font-weight: normal;">Na godzinę</label>
              <input type="number" id="newLimitPerHour" placeholder="10" min="1" max="100" />
            </div>
            <div>
              <label for="newLimitPerDay" style="font-size: 13px; font-weight: normal;">Na dzień</label>
              <input type="number" id="newLimitPerDay" placeholder="50" min="1" max="500" />
            </div>
          </div>
          <small style="color: #666;">Opcjonalne - dedykowane limity dla tej kampanii. Jeśli puste, użyje globalnych (10/godz, 50/dzień).</small>
        </div>

        <div class="form-group">
          <label>Dostawca AI *</label>
          <div style="display: flex; gap: 20px; margin-top: 8px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="radio" name="aiProvider" value="anthropic" checked onchange="toggleAiProviderFields()">
              <span>Anthropic Claude</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="radio" name="aiProvider" value="gemini" onchange="toggleAiProviderFields()">
              <span>Google Gemini</span>
            </label>
          </div>
          <small style="color: #666;">Wybierz AI do generowania treści i researchu</small>
        </div>

        <div class="form-group">
          <label for="newAiApiKey">AI API Key</label>
          <input type="password" id="newAiApiKey" placeholder="sk-ant-... lub API key z Google AI Studio" />
          <small style="color: #666;">Opcjonalne - dedykowany klucz API. Jeśli puste, użyje globalnego.</small>
        </div>

        <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; border-left: 4px solid #2196f3; margin: 15px 0;">
          <strong style="color: #1976d2;">ℹ️ Autoryzacja Google:</strong>
          <p style="margin: 8px 0 0 0; color: #555;">
            Po dodaniu arkusza, kliknij przycisk <strong>"🔐 Połącz konto Google"</strong> aby autoryzować dostęp do Gmail i Google Sheets.
          </p>
        </div>

        <div>
          <button onclick="addSpreadsheet()">💾 Dodaj arkusz</button>
          <button onclick="hideAddSpreadsheetForm()" class="danger">Anuluj</button>
        </div>

        <div id="spreadsheetSuccess" class="success-message"></div>
        <div id="spreadsheetError" class="error-message"></div>
      </div>
    </div>

    <div class="section">
      <h2>⚙️ Konfiguracja</h2>
      <div class="info-grid">
        <div class="info-card">
          <div class="info-label">Google Sheet</div>
          <div class="info-value">${config.googleSheetName}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Nadawca</div>
          <div class="info-value" style="font-size: 16px;">${config.senderEmail}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Limity (godz/dzień)</div>
          <div class="info-value">${config.limitPerHour} / ${config.limitPerDay}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Okno wysyłki</div>
          <div class="info-value" style="font-size: 18px;">${config.sendHourStart}:00-${config.sendHourEnd}:00</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>🎛️ Scheduler</h2>
      <p>Automatyczne uruchamianie co <strong>${config.cronIntervalMinutes} minut</strong></p>
      <div>
        <button class="success" onclick="fetch('/api/scheduler/start', {method:'POST'}).then(() => alert('Scheduler uruchomiony!')).catch(e => alert('Błąd: ' + e))">▶️ Start</button>
        <button class="danger" onclick="fetch('/api/scheduler/stop', {method:'POST'}).then(() => alert('Scheduler zatrzymany!')).catch(e => alert('Błąd: ' + e))">⏹️ Stop</button>
        <button onclick="fetch('/api/scheduler/run-now', {method:'POST'}).then(() => alert('Uruchomiono proces!')).catch(e => alert('Błąd: ' + e))">⚡ Uruchom teraz</button>
        <button onclick="window.location.reload()">🔄 Odśwież status</button>
      </div>
    </div>

    <div class="section">
      <h2>🔧 Procesy manualne</h2>
      <p>Uruchom poszczególne kroki osobno</p>
      <div>
        <button onclick="runProcess('research')">🔍 Research</button>
        <button onclick="runProcess('sequences')">📧 Generuj sekwencje</button>
        <button onclick="runProcess('send')">📤 Wyślij emaile</button>
        <button onclick="runProcess('check-replies')">📬 Sprawdź odpowiedzi</button>
      </div>
    </div>

    <div class="section">
      <h2>📊 API Endpoints</h2>
      <p>
        <code>GET /api/health</code> - Health check<br>
        <code>GET /api/leads</code> - Wszystkie leady<br>
        <code>GET /api/leads/to-process</code> - Leady do przetworzenia<br>
        <code>GET /api/rate-limits</code> - Status limitów<br>
        <code>GET /api/scheduler/status</code> - Status schedulera<br>
        <code>POST /api/scheduler/start</code> - Start schedulera<br>
        <code>POST /api/scheduler/stop</code> - Stop schedulera<br>
        <code>POST /api/scheduler/run-now</code> - Uruchom teraz<br>
        <code>POST /api/process/research</code> - Tylko research<br>
        <code>POST /api/process/sequences</code> - Tylko sekwencje<br>
        <code>POST /api/process/send</code> - Tylko wysyłka<br>
        <code>POST /api/process/check-replies</code> - Tylko odpowiedzi
      </p>
    </div>
  </div>

  <script>
    async function runProcess(type) {
      try {
        const response = await fetch(\`/api/process/\${type}\`, {method: 'POST'});
        const data = await response.json();
        alert(data.message || 'Gotowe!');
      } catch (error) {
        alert('Błąd: ' + error.message);
      }
    }

    async function saveApiKey() {
      const apiKey = document.getElementById('apiKey').value;
      const successDiv = document.getElementById('configSuccess');
      const errorDiv = document.getElementById('configError');

      // Hide previous messages
      successDiv.style.display = 'none';
      errorDiv.style.display = 'none';

      if (!apiKey || apiKey === '••••••••••••••••') {
        errorDiv.textContent = 'Proszę wpisać API key';
        errorDiv.style.display = 'block';
        return;
      }

      if (!apiKey.startsWith('sk-ant-')) {
        errorDiv.textContent = 'Nieprawidłowy format API key (powinien zaczynać się od sk-ant-)';
        errorDiv.style.display = 'block';
        return;
      }

      try {
        const response = await fetch('/api/config/api-key', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ anthropicApiKey: apiKey })
        });

        const data = await response.json();

        if (data.success) {
          successDiv.textContent = '✓ API key zapisany! Odśwież stronę aby zobaczyć zmiany.';
          successDiv.style.display = 'block';
          setTimeout(() => window.location.reload(), 2000);
        } else {
          errorDiv.textContent = 'Błąd: ' + data.error;
          errorDiv.style.display = 'block';
        }
      } catch (error) {
        errorDiv.textContent = 'Błąd połączenia: ' + error.message;
        errorDiv.style.display = 'block';
      }
    }

    async function saveTestEmail() {
      const testEmail = document.getElementById('testEmail').value;
      const successDiv = document.getElementById('configSuccess');
      const errorDiv = document.getElementById('configError');

      // Hide previous messages
      successDiv.style.display = 'none';
      errorDiv.style.display = 'none';

      if (!testEmail) {
        errorDiv.textContent = 'Proszę wpisać adres email';
        errorDiv.style.display = 'block';
        return;
      }

      try {
        const response = await fetch('/api/config', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ testEmail: testEmail })
        });

        const data = await response.json();

        if (data.success) {
          successDiv.textContent = '✓ Test email zapisany! Odśwież stronę aby zobaczyć zmiany.';
          successDiv.style.display = 'block';
          setTimeout(() => window.location.reload(), 2000);
        } else {
          errorDiv.textContent = 'Błąd: ' + data.error;
          errorDiv.style.display = 'block';
        }
      } catch (error) {
        errorDiv.textContent = 'Błąd połączenia: ' + error.message;
        errorDiv.style.display = 'block';
      }
    }

    // Toggle instructions panel
    function toggleInstructions() {
      const panel = document.getElementById('instructionsPanel');
      if (panel.style.display === 'none') {
        panel.style.display = 'block';
      } else {
        panel.style.display = 'none';
      }
    }

    // Spreadsheet management functions
    async function loadSpreadsheets() {
      try {
        const response = await fetch('/api/spreadsheets');
        const data = await response.json();

        if (data.success) {
          const listDiv = document.getElementById('spreadsheetsList');

          if (data.spreadsheets.length === 0) {
            listDiv.innerHTML = '<p style="color: #666;">Brak arkuszy. Dodaj pierwszy!</p>';
            // Automatically show the form when there are no spreadsheets
            showAddSpreadsheetForm();
            return;
          }

          listDiv.innerHTML = data.spreadsheets.map(s => {
            const hasAuth = !!(s.googleAccessToken && s.googleRefreshToken);
            const authBadge = hasAuth
              ? '<span style="background: #28a745; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px; margin-left: 8px;">🔐 Połączono z Google</span>'
              : '<span style="background: #dc3545; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px; margin-left: 8px;">⚠️ Wymaga autoryzacji</span>';

            return \`
            <div style="padding: 15px; background: white; border-radius: 6px; margin-bottom: 10px; border: 1px solid #ddd;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="font-size: 16px;">\${s.name}</strong>
                  <span class="badge \${s.active ? 'active' : 'inactive'}" style="margin-left: 10px;">
                    \${s.active ? '✓ Aktywny' : '✗ Nieaktywny'}
                  </span>
                  \${authBadge}
                  <div style="margin-top: 8px; font-size: 14px; color: #666;">
                    📧 <strong>\${s.senderName}</strong> &lt;\${s.senderEmail}&gt;<br>
                    📊 Sheet: <code>\${s.sheetName}</code><br>
                    🤖 AI: <strong>\${s.aiProvider === 'gemini' ? 'Google Gemini' : 'Anthropic Claude'}</strong><br>
                    📊 Limity: \${s.limitPerHour || 'Global'}/godz, \${s.limitPerDay || 'Global'}/dzień<br>
                    🆔 ID: <code style="font-size: 11px;">\${s.spreadsheetId}</code>
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <div>
                    <button onclick="editSpreadsheet('\${s.id}')" style="padding: 8px 16px; margin: 2px; background: #28a745;">
                      ✏️ Edytuj
                    </button>
                    <button onclick="toggleSpreadsheet('\${s.id}')" style="padding: 8px 16px; margin: 2px;">
                      \${s.active ? '⏸️ Dezaktywuj' : '▶️ Aktywuj'}
                    </button>
                    <button onclick="deleteSpreadsheet('\${s.id}')" class="danger" style="padding: 8px 16px; margin: 2px;">
                      🗑️ Usuń
                    </button>
                  </div>
                  <div>
                    <button onclick="connectGoogleAccount('\${s.id}')" style="padding: 8px 16px; margin: 2px; background: #4285f4; color: white; width: 100%;">
                      \${hasAuth ? '🔄 Odnów połączenie' : '🔐 Połącz konto Google'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          \`;
          }).join('');
        }
      } catch (error) {
        console.error('Error loading spreadsheets:', error);
      }
    }

    function showAddSpreadsheetForm() {
      document.getElementById('addSpreadsheetForm').style.display = 'block';
    }

    // Global variables for file uploads
    let editingSpreadsheetId = null; // For edit mode

    function handleSignatureFileSelect(event) {
      const file = event.target.files[0];
      const statusDiv = document.getElementById('signatureFileStatus');
      const signatureTextarea = document.getElementById('newSignature');

      if (!file) {
        statusDiv.innerHTML = '';
        return;
      }

      if (!file.name.match(/\.(html|htm)$/i)) {
        statusDiv.innerHTML = '<span style="color: red;">❌ Plik musi być w formacie HTML</span>';
        return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        const content = e.target.result;
        signatureTextarea.value = content;
        statusDiv.innerHTML = '<span style="color: green;">✅ ' + file.name + ' załadowany</span>';
      };
      reader.readAsText(file);
    }

    function toggleAiProviderFields() {
      const selectedProvider = document.querySelector('input[name="aiProvider"]:checked').value;
      const apiKeyInput = document.getElementById('newAiApiKey');

      if (selectedProvider === 'gemini') {
        apiKeyInput.placeholder = 'API key z Google AI Studio';
      } else {
        apiKeyInput.placeholder = 'sk-ant-... Anthropic API key';
      }
    }

    function hideAddSpreadsheetForm() {
      document.getElementById('addSpreadsheetForm').style.display = 'none';
      editingSpreadsheetId = null;
      // Clear form
      document.getElementById('newSpreadsheetId').value = '';
      document.getElementById('newSheetName').value = 'Leads';
      document.getElementById('newSpreadsheetName').value = '';
      document.getElementById('newSenderEmail').value = '';
      document.getElementById('newSenderName').value = '';
      document.getElementById('newSignature').value = '';
      document.getElementById('newSignatureFile').value = '';
      document.getElementById('signatureFileStatus').innerHTML = '';
      document.getElementById('newLimitPerHour').value = '';
      document.getElementById('newLimitPerDay').value = '';
      document.getElementById('newAiApiKey').value = '';
      document.querySelector('input[name="aiProvider"][value="anthropic"]').checked = true;

      // Update button text
      const addButton = document.querySelector('#addSpreadsheetForm button[onclick="addSpreadsheet()"]');
      addButton.textContent = '💾 Dodaj arkusz';
    }

    function editSpreadsheet(id) {
      // Fetch spreadsheet data
      fetch('/api/spreadsheets')
        .then(res => res.json())
        .then(data => {
          const spreadsheet = data.spreadsheets.find(s => s.id === id);
          if (!spreadsheet) {
            alert('Nie znaleziono arkusza');
            return;
          }

          // Populate form
          editingSpreadsheetId = id;
          document.getElementById('newSpreadsheetId').value = spreadsheet.spreadsheetId;
          document.getElementById('newSheetName').value = spreadsheet.sheetName;
          document.getElementById('newSpreadsheetName').value = spreadsheet.name;
          document.getElementById('newSenderEmail').value = spreadsheet.senderEmail;
          document.getElementById('newSenderName').value = spreadsheet.senderName;
          document.getElementById('newSignature').value = spreadsheet.signature || '';
          document.getElementById('newLimitPerHour').value = spreadsheet.limitPerHour || '';
          document.getElementById('newLimitPerDay').value = spreadsheet.limitPerDay || '';
          document.getElementById('newAiApiKey').value = spreadsheet.aiApiKey ? '••••••••' : '';

          // Set AI provider
          const providerRadio = document.querySelector('input[name="aiProvider"][value="' + spreadsheet.aiProvider + '"]');
          if (providerRadio) {
            providerRadio.checked = true;
            toggleAiProviderFields();
          }

          // Show form
          document.getElementById('addSpreadsheetForm').style.display = 'block';

          // Update button text
          const addButton = document.querySelector('#addSpreadsheetForm button[onclick="addSpreadsheet()"]');
          addButton.textContent = '💾 Zapisz zmiany';

          // Scroll to form
          document.getElementById('addSpreadsheetForm').scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
          alert('Błąd podczas ładowania danych: ' + error);
        });
    }

    async function addSpreadsheet() {
      const successDiv = document.getElementById('spreadsheetSuccess');
      const errorDiv = document.getElementById('spreadsheetError');

      successDiv.style.display = 'none';
      errorDiv.style.display = 'none';

      let spreadsheetInput = document.getElementById('newSpreadsheetId').value.trim();

      // Extract ID from URL if user pasted full URL
      let spreadsheetId = spreadsheetInput;
      if (spreadsheetInput.includes('docs.google.com/spreadsheets')) {
        // Extract ID from URL like: https://docs.google.com/spreadsheets/d/ID/edit
        const match = spreadsheetInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          spreadsheetId = match[1];
          console.log('Extracted spreadsheet ID from URL:', spreadsheetId);
        } else {
          errorDiv.textContent = 'Nie można wyciągnąć ID z tego URLa. Sprawdź czy URL jest poprawny.';
          errorDiv.style.display = 'block';
          return;
        }
      }
      const sheetName = document.getElementById('newSheetName').value.trim();
      const name = document.getElementById('newSpreadsheetName').value.trim();
      const senderEmail = document.getElementById('newSenderEmail').value.trim();
      const senderName = document.getElementById('newSenderName').value.trim();
      const signature = document.getElementById('newSignature').value.trim();
      const limitPerHour = document.getElementById('newLimitPerHour').value.trim();
      const limitPerDay = document.getElementById('newLimitPerDay').value.trim();
      const aiProvider = document.querySelector('input[name="aiProvider"]:checked').value;
      const aiApiKey = document.getElementById('newAiApiKey').value.trim();

      if (!spreadsheetId || !sheetName || !name || !senderEmail || !senderName) {
        errorDiv.textContent = 'Wszystkie pola są wymagane!';
        errorDiv.style.display = 'block';
        return;
      }

      try {
        const payload = {
          spreadsheetId,
          sheetName,
          name,
          senderEmail,
          senderName,
          replyToEmail: senderEmail,
          aiProvider: aiProvider,
          active: true
        };

        // Add optional fields
        if (signature) {
          payload.signature = signature;
        }
        if (aiApiKey && aiApiKey !== '••••••••') {
          payload.aiApiKey = aiApiKey;
        }
        if (limitPerHour) {
          payload.limitPerHour = parseInt(limitPerHour, 10);
        }
        if (limitPerDay) {
          payload.limitPerDay = parseInt(limitPerDay, 10);
        }

        // Determine if this is edit or add
        const isEdit = editingSpreadsheetId !== null;
        const url = isEdit ? '/api/spreadsheets/' + editingSpreadsheetId : '/api/spreadsheets';
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method: method,
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
          successDiv.textContent = isEdit ? '✓ Zmiany zapisane! Odświeżam...' : '✓ Arkusz dodany! Odświeżam...';
          successDiv.style.display = 'block';
          setTimeout(() => {
            hideAddSpreadsheetForm();
            loadSpreadsheets();
          }, 1000);
        } else {
          errorDiv.textContent = 'Błąd: ' + data.error;
          errorDiv.style.display = 'block';
        }
      } catch (error) {
        errorDiv.textContent = 'Błąd połączenia: ' + error.message;
        errorDiv.style.display = 'block';
      }
    }

    async function toggleSpreadsheet(id) {
      try {
        const response = await fetch(\`/api/spreadsheets/\${id}/toggle\`, {method: 'POST'});
        const data = await response.json();

        if (data.success) {
          alert(data.message);
          loadSpreadsheets();
        } else {
          alert('Błąd: ' + data.error);
        }
      } catch (error) {
        alert('Błąd połączenia: ' + error.message);
      }
    }

    async function deleteSpreadsheet(id) {
      if (!confirm('Czy na pewno chcesz usunąć ten arkusz?')) {
        return;
      }

      try {
        const response = await fetch(\`/api/spreadsheets/\${id}\`, {method: 'DELETE'});
        const data = await response.json();

        if (data.success) {
          alert('Arkusz usunięty');
          loadSpreadsheets();
        } else {
          alert('Błąd: ' + data.error);
        }
      } catch (error) {
        alert('Błąd połączenia: ' + error.message);
      }
    }

    function connectGoogleAccount(spreadsheetId) {
      // Direct redirect to OAuth flow (more reliable than popup)
      console.log('Redirecting to Google OAuth for spreadsheet:', spreadsheetId);
      window.location.href = \`/auth/google?spreadsheetId=\${spreadsheetId}\`;
    }

    // Load spreadsheets on page load
    window.addEventListener('DOMContentLoaded', loadSpreadsheets);
  </script>
</body>
</html>
  `;
    res.send(html);
});
// Start server
app.listen(config.port, async () => {
    console.log(`\n🌐 Server running on http://localhost:${config.port}`);
    console.log(`📊 Dashboard: http://localhost:${config.port}`);
    console.log(`🔗 API: http://localhost:${config.port}/api/health\n`);
    // Initialize
    await initialize();
});
export default app;
//# sourceMappingURL=index.js.map