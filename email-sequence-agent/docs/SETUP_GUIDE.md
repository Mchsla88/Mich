# Setup Guide - Krok po kroku

## 📋 Wymagania wstępne

- [ ] Konto Google
- [ ] Konto Anthropic (Claude API)
- [ ] Node.js 18+ zainstalowany
- [ ] Git zainstalowany

---

## 1️⃣ Konfiguracja Google Cloud

### Krok 1.1: Utwórz projekt

1. Przejdź do: https://console.cloud.google.com/
2. Kliknij **Select a project** → **NEW PROJECT**
3. Nazwa projektu: `Email Sequence Agent`
4. Kliknij **CREATE**

### Krok 1.2: Włącz API

1. W menu bocznym: **APIs & Services** → **Enable APIs and Services**
2. Szukaj i włącz:
   - **Google Sheets API**
   - **Gmail API**

### Krok 1.3: Utwórz Service Account

1. **APIs & Services** → **Credentials**
2. Kliknij **+ CREATE CREDENTIALS** → **Service account**
3. Wypełnij:
   - Service account name: `email-agent`
   - Service account ID: `email-agent` (auto)
4. Kliknij **CREATE AND CONTINUE**
5. Grant this service account access to project:
   - Role: **Editor**
6. Kliknij **CONTINUE** → **DONE**

### Krok 1.4: Utwórz klucz JSON

1. Kliknij na utworzony Service Account
2. Zakładka **KEYS**
3. **ADD KEY** → **Create new key**
4. Wybierz **JSON**
5. Kliknij **CREATE**
6. Plik `email-agent-xxxxx.json` zostanie pobrany

### Krok 1.5: Zapisz credentials

```bash
# Z głównego folderu projektu
mkdir -p email-sequence-agent/backend/credentials
mv ~/Downloads/email-agent-xxxxx.json email-sequence-agent/backend/credentials/google-credentials.json
```

---

## 2️⃣ Konfiguracja Google Sheets

### Krok 2.1: Otwórz arkusz

1. Przejdź do: https://docs.google.com/spreadsheets/d/13CYoUh8BpVi4dOjeXrU1NFIt9PTVpKKhrdQGpggYzZ4/edit

### Krok 2.2: Utwórz zakładkę "Leads"

1. Kliknij **+** na dole (dodaj nową zakładkę)
2. Nazwij: `Leads`

### Krok 2.3: Zaimportuj template

**Opcja A: Import CSV**
1. W arkuszu: **File** → **Import**
2. Wybierz plik: `email-sequence-agent/docs/leads_template.csv`
3. Import location: **Replace current sheet**
4. Separator type: **Comma**
5. Kliknij **Import data**

**Opcja B: Manualne kopiowanie**
1. Otwórz plik: `email-sequence-agent/docs/GOOGLE_SHEETS_TEMPLATE.md`
2. Skopiuj nagłówki do wiersza 1

### Krok 2.4: Udostępnij arkusz Service Account

1. Kliknij **Share** (prawy górny róg)
2. Otwórz plik `email-sequence-agent/backend/credentials/google-credentials.json`
3. Znajdź wartość `client_email` (np. `email-agent@project-id.iam.gserviceaccount.com`)
4. Wklej ten email w **Add people and groups**
5. Ustaw rolę: **Editor**
6. Kliknij **Send** (odznacz "Notify people")

---

## 3️⃣ Konfiguracja Anthropic API

### Krok 3.1: Utwórz konto

1. Przejdź do: https://console.anthropic.com/
2. Zarejestruj się / Zaloguj

### Krok 3.2: Uzyskaj API key

1. W konsoli: **API Keys**
2. Kliknij **Create Key**
3. Skopiuj klucz (zaczyna się od `sk-ant-api03-`)

⚠️ **Zapisz klucz w bezpiecznym miejscu - nie będzie można go ponownie zobaczyć!**

---

## 4️⃣ Instalacja projektu

### Krok 4.1: Przejdź do folderu

```bash
cd email-sequence-agent/backend
```

### Krok 4.2: Zainstaluj zależności

```bash
npm install
```

Poczekaj aż zainstaluje się ~30 pakietów.

---

## 5️⃣ Konfiguracja .env

### Krok 5.1: Utwórz plik .env

```bash
cp .env.example .env
```

### Krok 5.2: Edytuj .env

Otwórz plik `.env` i wypełnij:

```env
# Application
PORT=3002
NODE_ENV=development

# Google Sheets
GOOGLE_SPREADSHEET_ID=13CYoUh8BpVi4dOjeXrU1NFIt9PTVpKKhrdQGpggYzZ4
GOOGLE_SHEET_NAME=Leads

# Google Cloud credentials
GOOGLE_APPLICATION_CREDENTIALS=./credentials/google-credentials.json

# Gmail API
SENDER_EMAIL=michal@mayiawebsite.pl
SENDER_NAME=Michał Sławiński
REPLY_TO_EMAIL=michal@mayiawebsite.pl

# Test mode (⚠️ START W DRY RUN!)
DRY_RUN=true
TEST_EMAIL=michal@ad-apt.me

# Sending limits
LIMIT_PER_HOUR=10
LIMIT_PER_DAY=50

# Sending hours (Europe/Warsaw)
SEND_HOUR_START=9
SEND_HOUR_END=18
SEND_WEEKENDS=false

# AI Configuration (Anthropic Claude)
ANTHROPIC_API_KEY=sk-ant-api03-TWÓJ_KLUCZ_TUTAJ
AI_MODEL=claude-3-5-sonnet-20241022

# Scheduler
CRON_INTERVAL_MINUTES=5
TIMEZONE=Europe/Warsaw

# Sequence timing (in days)
STEP2_DELAY_DAYS=3
STEP3_DELAY_DAYS=7

# Daily limits
MAX_LEADS_PER_DAY=50

# Thread support
USE_EMAIL_THREADS=true
```

### Krok 5.3: Weryfikacja

Sprawdź czy:
- [ ] `GOOGLE_SPREADSHEET_ID` jest poprawne
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` wskazuje na plik credentials
- [ ] `ANTHROPIC_API_KEY` jest wypełniony
- [ ] `DRY_RUN=true` (na start!)
- [ ] `TEST_EMAIL` jest Twoim adresem testowym

---

## 6️⃣ Pierwszy test

### Krok 6.1: Uruchom serwer

```bash
npm run dev
```

Powinieneś zobaczyć:
```
🚀 Email Sequence Agent - Starting...

Configuration:
  Spreadsheet ID: 13CYoUh8BpVi4dOjeXrU1NFIt9PTVpKKhrdQGpggYzZ4
  Sheet Name: Leads
  Sender: Michał Sławiński <michal@mayiawebsite.pl>
  Dry Run: true
  Test Email: michal@ad-apt.me
  ...

✅ Google Auth initialized
⏰ Starting scheduler: every 5 minutes
✅ Scheduler started!

🌐 Server running on http://localhost:3002
```

### Krok 6.2: Otwórz dashboard

Przejdź do: http://localhost:3002

Powinieneś zobaczyć panel administracyjny.

### Krok 6.3: Test health check

```bash
curl http://localhost:3002/api/health
```

Powinno zwrócić:
```json
{
  "status": "ok",
  "timestamp": "...",
  "config": { ... }
}
```

---

## 7️⃣ Dodaj pierwszego leada (TEST)

### Krok 7.1: Otwórz Google Sheets

1. Przejdź do arkusza
2. Zakładka **Leads**

### Krok 7.2: Dodaj wiersz testowy

W wierszu 2 (pierwszy wiersz danych) wpisz:

| A (email) | B (firma) | C (website_url) | D (imie) | E (generuj) |
|-----------|-----------|-----------------|----------|-------------|
| `twoj-test@example.com` | `Test Firma` | `https://example.com` | `Jan` | `☑` (TRUE) |

⚠️ **WAŻNE**: Zaznacz checkbox w kolumnie E!

### Krok 7.3: Poczekaj max 5 minut

System automatycznie:
1. Wykryje nowego leada
2. Wykona research strony
3. Wygeneruje sekwencję
4. Wyśle pierwszy email (na TEST_EMAIL!)

### Krok 7.4: Sprawdź logi

W konsoli gdzie uruchomiłeś `npm run dev` zobaczysz:
```
🔍 === PROCESSING RESEARCH ===
📊 Researching: Test Firma (twoj-test@example.com)
✅ Research completed

📧 === PROCESSING SEQUENCE GENERATION ===
✉️  Generating sequence: Test Firma
✅ Sequence generated

📤 === PROCESSING SENDING ===
📨 Sending Step 1 to twoj-test@example.com
🧪 DRY RUN: Would send to twoj-test@example.com, but sending to michal@ad-apt.me instead
✅ Step 1 sent
```

### Krok 7.5: Sprawdź email

Sprawdź skrzynkę `TEST_EMAIL` - powinieneś otrzymać email!

---

## 8️⃣ Wyłączenie Dry Run (produkcja)

⚠️ **UWAGA**: Po wyłączeniu Dry Run, emaile będą wysyłane do rzeczywistych adresatów!

### Krok 8.1: Edytuj .env

```env
DRY_RUN=false
```

### Krok 8.2: Restart serwera

```bash
# Ctrl+C aby zatrzymać
npm run dev
```

---

## ✅ Checklist - Czy wszystko działa?

- [ ] Serwer uruchamia się bez błędów
- [ ] Dashboard działa (http://localhost:3002)
- [ ] `/api/health` zwraca `status: "ok"`
- [ ] Google Sheets - dane są czytane
- [ ] Test lead - research wykonany
- [ ] Test lead - sekwencja wygenerowana
- [ ] Test email - otrzymany na TEST_EMAIL
- [ ] Scheduler - działa co 5 minut

---

## 🐛 Troubleshooting

### Problem: "Google Auth failed"

**Rozwiązanie:**
1. Sprawdź czy plik `credentials/google-credentials.json` istnieje
2. Sprawdź `GOOGLE_APPLICATION_CREDENTIALS` w `.env`
3. Sprawdź czy Service Account ma dostęp do arkusza (Share)

### Problem: "ANTHROPIC_API_KEY not set"

**Rozwiązanie:**
1. Sprawdź czy w `.env` masz: `ANTHROPIC_API_KEY=sk-ant-api03-...`
2. Sprawdź czy klucz jest poprawny (nie ma spacji)

### Problem: "Outside sending hours"

**Rozwiązanie:**
1. Zmień w `.env`:
```env
SEND_HOUR_START=0
SEND_HOUR_END=23
SEND_WEEKENDS=true
```

### Problem: "Rate limit reached"

**Rozwiązanie:**
Poczekaj 1 godzinę lub zwiększ limity w `.env`:
```env
LIMIT_PER_HOUR=20
LIMIT_PER_DAY=100
```

---

## 🎉 Gotowe!

System jest skonfigurowany i działa!

Następne kroki:
1. Dodaj prawdziwe leady do Google Sheets
2. Monitoruj dashboard i logi
3. Sprawdzaj odpowiedzi od klientów
4. Dostosuj prompty AI do swoich potrzeb

---

## 📚 Dodatkowe zasoby

- [README.md](../README.md) - Główna dokumentacja
- [GOOGLE_SHEETS_TEMPLATE.md](./GOOGLE_SHEETS_TEMPLATE.md) - Opis kolumn
- [API_EXAMPLES.md](./API_EXAMPLES.md) - Przykłady API
