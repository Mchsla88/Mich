# 📧 Email Sequence Agent

AI-powered email sequence automation system z integracją Google Sheets i Gmail API.

## ✨ Funkcje

- ✅ **Automatyczna analiza stron WWW** - Claude AI wykonuje głęboki audyt strony prospektu
- ✅ **Generowanie spersonalizowanych sekwencji** - 3-step email sequence na podstawie researchu
- ✅ **Integracja z Google Sheets** - Łatwe zarządzanie leadami
- ✅ **Gmail API** - Wysyłka przez Twoje konto Gmail
- ✅ **Limity wysyłek** - 10/godzinę, 50/dzień (konfigurowalne)
- ✅ **Okno czasowe** - Wysyłka tylko w godzinach 9-18, Pon-Pt
- ✅ **Monitorowanie odpowiedzi** - Automatyczne zatrzymanie sekwencji gdy klient odpisze
- ✅ **Wątki emailowe** - Follow-upy w tym samym wątku (Re:)
- ✅ **Dry run mode** - Testowanie na adresie testowym
- ✅ **Dashboard** - Prosty panel administracyjny

## 🚀 Quick Start

### Wymagania

- Node.js 18+
- Konto Google Cloud z włączonymi API:
  - Google Sheets API
  - Gmail API
- Klucz API Anthropic (Claude)

### 1. Instalacja

```bash
cd email-sequence-agent/backend
npm install
```

### 2. Konfiguracja Google Cloud

#### A. Utwórz projekt w Google Cloud Console

1. Przejdź do https://console.cloud.google.com/
2. Utwórz nowy projekt: **Email Sequence Agent**
3. Włącz API:
   - Google Sheets API
   - Gmail API

#### B. Utwórz Service Account

1. Przejdź do: **IAM & Admin** → **Service Accounts**
2. Kliknij **Create Service Account**
3. Nazwa: `email-agent`
4. Przyznaj role:
   - **Google Sheets API** → Editor
   - **Gmail API** → Sender
5. Kliknij **Create Key** → JSON
6. Zapisz plik jako `google-credentials.json`

#### C. Umieść credentials

```bash
mkdir -p email-sequence-agent/backend/credentials
mv ~/Downloads/google-credentials.json email-sequence-agent/backend/credentials/
```

#### D. Udostępnij Google Sheets

1. Otwórz swój arkusz: https://docs.google.com/spreadsheets/d/13CYoUh8BpVi4dOjeXrU1NFIt9PTVpKKhrdQGpggYzZ4/edit
2. Kliknij **Share**
3. Dodaj email Service Account (znajdziesz go w `google-credentials.json` jako `client_email`)
4. Ustaw rolę: **Editor**

### 3. Przygotuj Google Sheets

#### Zaimportuj template CSV

1. Otwórz arkusz
2. Utwórz zakładkę o nazwie **Leads**
3. Zaimportuj: `docs/leads_template.csv`
4. Lub skopiuj nagłówki manualnie (patrz: `docs/GOOGLE_SHEETS_TEMPLATE.md`)

### 4. Konfiguracja środowiska

Skopiuj plik `.env.example` do `.env`:

```bash
cd email-sequence-agent/backend
cp .env.example .env
```

Edytuj `.env`:

```env
# Google Sheets
GOOGLE_SPREADSHEET_ID=13CYoUh8BpVi4dOjeXrU1NFIt9PTVpKKhrdQGpggYzZ4
GOOGLE_SHEET_NAME=Leads

# Google credentials
GOOGLE_APPLICATION_CREDENTIALS=./credentials/google-credentials.json

# Gmail
SENDER_EMAIL=michal@mayiawebsite.pl
SENDER_NAME=Michał Sławiński
REPLY_TO_EMAIL=michal@mayiawebsite.pl

# Test mode (START W DRY RUN!)
DRY_RUN=true
TEST_EMAIL=michal@ad-apt.me

# Limity
LIMIT_PER_HOUR=10
LIMIT_PER_DAY=50

# Godziny wysyłki
SEND_HOUR_START=9
SEND_HOUR_END=18
SEND_WEEKENDS=false

# AI (Anthropic Claude)
ANTHROPIC_API_KEY=sk-ant-api03-...
AI_MODEL=claude-3-5-sonnet-20241022

# Scheduler
CRON_INTERVAL_MINUTES=5
TIMEZONE=Europe/Warsaw
```

### 5. Uruchomienie

```bash
# Development mode (auto-reload)
npm run dev

# Production
npm run build
npm start
```

System uruchomi się na: **http://localhost:3002**

## 📖 Jak używać

### Dodawanie leadów

1. Otwórz Google Sheets
2. Dodaj wiersz z danymi:
   - **email** - adres prospektu
   - **firma** - nazwa firmy
   - **website_url** - link do strony (np. `https://firma.pl`)
   - **imie** - imię kontaktu
3. **ZAZNACZ checkbox w kolumnie `generuj`** (kolumna E)
4. System automatycznie (w ciągu 5 minut):
   - Wykona research strony WWW
   - Wygeneruje 3-step email sequence
   - Rozpocznie wysyłkę

### Monitoring

- **Dashboard**: http://localhost:3002
- **API Health**: http://localhost:3002/api/health
- **Logi**: Terminal gdzie uruchomiłeś aplikację

### Statusy leadów

- `nowy` - Lead dodany, oczekuje na research
- `research` - W trakcie analizy strony WWW
- `sekwencja` - Sekwencja wygenerowana, oczekuje na wysyłkę
- `wysłane` - Co najmniej 1 email wysłany
- `odpowiedź` - Otrzymano odpowiedź od klienta (**STOP sekwencji**)
- `zakończone` - Wszystkie 3 emaile wysłane

### Zatrzymanie sekwencji

- **Automatyczne**: Gdy klient odpowie (`reply_received=true`)
- **Manualne**: Odznacz checkbox `generuj` w Google Sheets

## 🎛️ Dashboard

### Funkcje panelu

1. **Start/Stop Scheduler** - Włącz/wyłącz automatyczne przetwarzanie
2. **Uruchom teraz** - Manualny trigger pełnego cyklu
3. **Procesy manualne**:
   - 🔍 **Research** - Tylko audyty stron
   - 📧 **Generuj sekwencje** - Tylko generowanie emaili
   - 📤 **Wyślij emaile** - Tylko wysyłka
   - 📬 **Sprawdź odpowiedzi** - Tylko monitorowanie

### API Endpoints

```bash
# Health check
GET /api/health

# Leads
GET /api/leads                    # Wszystkie leady
GET /api/leads/to-process         # Do przetworzenia

# Rate limits
GET /api/rate-limits

# Scheduler
GET /api/scheduler/status
POST /api/scheduler/start
POST /api/scheduler/stop
POST /api/scheduler/run-now

# Procesy
POST /api/process/research
POST /api/process/sequences
POST /api/process/send
POST /api/process/check-replies
```

## 📋 Workflow

```
1. Lead dodany do Google Sheets + generuj=TRUE
         ↓
2. [co 5 min] System wykrywa nowego leada
         ↓
3. Claude AI wykonuje research strony WWW
         ↓
4. Wyniki zapisywane do Google Sheets
         ↓
5. Claude AI generuje 3-step email sequence
         ↓
6. Sekwencja zapisywana do Google Sheets
         ↓
7. Wysyłka Email 1 (Day 0)
         ↓
8. [+3 dni] Email 2 (Follow-up 1)
         ↓
9. [+7 dni] Email 3 (Breakup)
         ↓
10. Monitorowanie odpowiedzi - jeśli odpowiedź → STOP
```

## 🔐 Bezpieczeństwo

### Dry Run Mode (ZALECANE NA START)

```env
DRY_RUN=true
TEST_EMAIL=twoj-testowy-adres@example.com
```

W tym trybie:
- Wszystkie emaile trafiają tylko na `TEST_EMAIL`
- Oryginalne adresy prospektów są ignorowane
- Możesz bezpiecznie testować całą sekwencję

### Wyłączenie Dry Run (produkcja)

⚠️ **UWAGA**: Emaile będą wysyłane do rzeczywistych adresatów!

```env
DRY_RUN=false
```

### Limity wysyłek

Gmail API ma dzienne limity wysyłek:
- **Konta Gmail**: ~500 emaili/dzień
- **Google Workspace**: ~2000 emaili/dzień

Nasze limity (konfigurowalne):
- `LIMIT_PER_HOUR=10`
- `LIMIT_PER_DAY=50`

### Compliance (RODO)

Stopka każdego emaila zawiera:
> Jeśli nie jesteś zainteresowany/a, daj znać - nie będę więcej pisać.

## 🛠️ Konfiguracja zaawansowana

### Zmiana promptów AI

Prompty są w:
- Research: `backend/src/services/research.service.ts`
- Sequence: `backend/src/services/sequence.service.ts`

### Zmiana stopki email

Edytuj: `backend/src/services/sequence.service.ts`

```typescript
const EMAIL_SIGNATURE = `
<div style="...">
  <p><strong>Twoje Imię</strong></p>
  ...
</div>
`;
```

### Dostosowanie harmonogramu

```env
# Częstotliwość (minuty)
CRON_INTERVAL_MINUTES=5

# Opóźnienia między emailami (dni)
STEP2_DELAY_DAYS=3
STEP3_DELAY_DAYS=7
```

### Zmiana modelu AI

```env
# Dostępne modele
AI_MODEL=claude-3-5-sonnet-20241022      # Najlepszy (droższy)
AI_MODEL=claude-3-haiku-20240307         # Szybszy (tańszy)
```

## 📊 Monitorowanie

### Logi w konsoli

System loguje każdą akcję:
```
🔍 === PROCESSING RESEARCH ===
📊 Researching: Firma ABC (jan@abc.pl)
✅ Research completed for Firma ABC

📧 === PROCESSING SEQUENCE GENERATION ===
✉️  Generating sequence: Firma ABC (jan@abc.pl)
✅ Sequence generated for Firma ABC

📤 === PROCESSING SENDING ===
📨 Sending Step 1 to jan@abc.pl (Firma ABC)
✅ Step 1 sent to jan@abc.pl

📬 === CHECKING REPLIES ===
📩 Reply received from jan@abc.pl
```

### Rate limit stats

```bash
curl http://localhost:3002/api/rate-limits
```

## 🐛 Troubleshooting

### "Google Auth failed"

1. Sprawdź czy plik `credentials/google-credentials.json` istnieje
2. Sprawdź czy `GOOGLE_APPLICATION_CREDENTIALS` w `.env` jest poprawne
3. Sprawdź czy Service Account ma dostęp do arkusza

### "ANTHROPIC_API_KEY not set"

1. Zarejestruj się na https://console.anthropic.com/
2. Utwórz API key
3. Dodaj do `.env`: `ANTHROPIC_API_KEY=sk-ant-api03-...`

### "Outside sending hours"

System wysyła emaile tylko w godzinach 9-18, Pon-Pt.

Aby zmienić:
```env
SEND_HOUR_START=8
SEND_HOUR_END=20
SEND_WEEKENDS=true
```

### "Rate limit reached"

Poczekaj do resetu limitu (1h lub 24h).

Lub zwiększ limity w `.env`:
```env
LIMIT_PER_HOUR=20
LIMIT_PER_DAY=100
```

## 📚 Dokumentacja

- [Google Sheets Template](./docs/GOOGLE_SHEETS_TEMPLATE.md)
- [Przykłady API](./docs/API_EXAMPLES.md)
- CSV Template: `docs/leads_template.csv`

## 🤝 Support

W razie problemów:
1. Sprawdź logi w konsoli
2. Sprawdź `/api/health`
3. Sprawdź status schedulera: `/api/scheduler/status`

## 📝 License

MIT

---

Made with ❤️ by Michał Sławiński
