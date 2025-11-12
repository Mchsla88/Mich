# Quick Start - Najszybszy sposób na start

## 1. Instalacja (2 min)

```bash
cd email-sequence-agent/backend
npm install
```

## 2. Konfiguracja Google (10 min)

### A. Service Account
1. https://console.cloud.google.com/ → Nowy projekt
2. Włącz API: **Google Sheets API** + **Gmail API**
3. Utwórz Service Account → Pobierz JSON
4. Zapisz jako: `backend/credentials/google-credentials.json`

### B. Google Sheets
1. Otwórz: https://docs.google.com/spreadsheets/d/13CYoUh8BpVi4dOjeXrU1NFIt9PTVpKKhrdQGpggYzZ4/edit
2. Utwórz zakładkę: **Leads**
3. Zaimportuj: `docs/leads_template.csv`
4. **Share** arkusz z email Service Account (jako Editor)

## 3. Konfiguracja .env (2 min)

```bash
cd backend
cp .env.example .env
nano .env  # lub vim, code, itp.
```

Wypełnij:
```env
ANTHROPIC_API_KEY=sk-ant-api03-TWÓJ_KLUCZ
TEST_EMAIL=twoj-email@example.com
DRY_RUN=true
```

## 4. Uruchom (1 min)

```bash
npm run dev
```

Otwórz: http://localhost:3002

## 5. Test (5 min)

1. Otwórz Google Sheets
2. Dodaj wiersz:
   - email: `test@example.com`
   - firma: `Test Corp`
   - website_url: `https://example.com`
   - imie: `Jan`
   - generuj: ☑️ (TRUE)
3. Poczekaj 5 minut
4. Sprawdź email na `TEST_EMAIL`

## Gotowe! 🎉

**Dokumentacja:**
- [Pełny README](./README.md)
- [Setup krok po kroku](./docs/SETUP_GUIDE.md)
- [Google Sheets template](./docs/GOOGLE_SHEETS_TEMPLATE.md)
- [API Examples](./docs/API_EXAMPLES.md)

**Problemy?**
- Sprawdź logi w konsoli
- Sprawdź: http://localhost:3002/api/health
- Zobacz: [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md#-troubleshooting)
