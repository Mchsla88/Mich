import express, { Request, Response } from 'express';
import config, { updateConfig, getConfig } from './config.js';
import * as sheetsService from './services/sheets.service.js';
import * as gmailService from './services/gmail.service.js';
import * as schedulerService from './services/scheduler.service.js';
import * as processorService from './services/processor.service.js';
import * as configStorage from './services/config.storage.js';

const app = express();

// Middleware
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Initialize
async function initialize() {
  try {
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

    // Initialize Google Auth
    await sheetsService.initGoogleAuth();

    // Start scheduler
    schedulerService.startScheduler();

    console.log('✅ Initialization complete!\n');
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

// ======================
// API ENDPOINTS
// ======================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
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
app.get('/api/leads', async (req: Request, res: Response) => {
  try {
    const leads = await sheetsService.getLeads();
    res.json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get leads to process
app.get('/api/leads/to-process', async (req: Request, res: Response) => {
  try {
    const leads = await sheetsService.getLeadsToProcess();
    res.json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get rate limit stats
app.get('/api/rate-limits', (req: Request, res: Response) => {
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
app.get('/api/scheduler/status', (req: Request, res: Response) => {
  const status = schedulerService.getStatus();
  res.json({
    success: true,
    status,
  });
});

// Start scheduler
app.post('/api/scheduler/start', (req: Request, res: Response) => {
  try {
    schedulerService.startScheduler();
    res.json({
      success: true,
      message: 'Scheduler started',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Stop scheduler
app.post('/api/scheduler/stop', (req: Request, res: Response) => {
  try {
    schedulerService.stopScheduler();
    res.json({
      success: true,
      message: 'Scheduler stopped',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Run now (manual trigger)
app.post('/api/scheduler/run-now', async (req: Request, res: Response) => {
  try {
    // Run in background
    schedulerService.runNow().catch(err => {
      console.error('Error in manual run:', err);
    });

    res.json({
      success: true,
      message: 'Manual run triggered',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Process research only
app.post('/api/process/research', async (req: Request, res: Response) => {
  try {
    const count = await processorService.processResearch();
    res.json({
      success: true,
      message: `Processed ${count} research tasks`,
      count,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Process sequence generation only
app.post('/api/process/sequences', async (req: Request, res: Response) => {
  try {
    const count = await processorService.processSequenceGeneration();
    res.json({
      success: true,
      message: `Generated ${count} sequences`,
      count,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Process sending only
app.post('/api/process/send', async (req: Request, res: Response) => {
  try {
    const count = await processorService.processSending();
    res.json({
      success: true,
      message: `Sent ${count} emails`,
      count,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Check replies only
app.post('/api/process/check-replies', async (req: Request, res: Response) => {
  try {
    const count = await processorService.checkReplies();
    res.json({
      success: true,
      message: `Found ${count} replies`,
      count,
    });
  } catch (error: any) {
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
app.get('/api/config', (req: Request, res: Response) => {
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
app.post('/api/config', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update API key specifically
app.post('/api/config/api-key', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Simple HTML dashboard
app.get('/', (req: Request, res: Response) => {
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
      <h2>🔑 API Configuration</h2>
      <p style="margin-bottom: 15px;">
        Anthropic API Key:
        <span class="config-status ${config.anthropicApiKey ? 'ok' : 'missing'}">
          ${config.anthropicApiKey ? '✓ Ustawiony' : '✗ Brak'}
        </span>
      </p>

      <div class="form-group">
        <label for="apiKey">Anthropic API Key (Claude AI)</label>
        <input
          type="password"
          id="apiKey"
          placeholder="sk-ant-api03-..."
          value="${config.anthropicApiKey ? '••••••••••••••••' : ''}"
        />
        <small style="color: #666;">Klucz API do Claude. Pobierz z: <a href="https://console.anthropic.com/" target="_blank">console.anthropic.com</a></small>
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
