# 📖 INSTRUKCJA URUCHOMIENIA - Krok po kroku

## 🎯 Co będziemy robić?

Ten przewodnik poprowadzi Cię przez cały proces uruchomienia systemu Email Sequence Agent od zera do pierwszego wysłanego emaila. Zajmie to około **30-40 minut**.

---

## ✅ Wymagania (sprawdź przed startem)

- [ ] Masz konto Google (Gmail)
- [ ] Masz kartę kredytową (do Anthropic - darmowy trial $5)
- [ ] Masz zainstalowane:
  - Node.js 18 lub nowszy ([pobierz tutaj](https://nodejs.org/))
  - Git ([pobierz tutaj](https://git-scm.com/))
  - Edytor tekstu (np. VS Code, Notepad++)

### Sprawdź czy masz Node.js:

```bash
node --version
# Powinno wyświetlić np: v18.17.0 lub wyższy
```

Jeśli nie masz lub wersja jest starsza niż 18, zainstaluj Node.js ze strony [nodejs.org](https://nodejs.org/).

---

## CZĘŚĆ 1: Konfiguracja Google Cloud (15 min)

### Krok 1.1: Utwórz projekt w Google Cloud Console

1. Otwórz przeglądarkę i przejdź do: **https://console.cloud.google.com/**
2. Zaloguj się swoim kontem Google
3. U góry strony, kliknij menu **Select a project** (obok logo Google Cloud)
4. Kliknij przycisk **NEW PROJECT** (prawy górny róg okna)
5. Wypełnij formularz:
   - **Project name**: `Email Sequence Agent`
   - **Location**: zostaw domyślne
6. Kliknij **CREATE**
7. Poczekaj ~30 sekund aż projekt się utworzy
8. Upewnij się, że jesteś w tym projekcie (sprawdź nazwę u góry)

### Krok 1.2: Włącz potrzebne API

1. W menu bocznym (lewe) kliknij: **APIs & Services** → **Enabled APIs & services**
2. Kliknij **+ ENABLE APIS AND SERVICES** (na górze)
3. W wyszukiwarce wpisz: `Google Sheets API`
4. Kliknij na wynik **Google Sheets API**
5. Kliknij przycisk **ENABLE**
6. Poczekaj aż się włączy (~10 sekund)
7. Kliknij **← (strzałkę wstecz)** żeby wrócić
8. Powtórz kroki 2-6 dla **Gmail API**:
   - Kliknij **+ ENABLE APIS AND SERVICES**
   - Wyszukaj: `Gmail API`
   - Kliknij **ENABLE**

✅ **Checkpoint**: Powinieneś mieć włączone 2 API (Google Sheets + Gmail)

### Krok 1.3: Utwórz Service Account (konto serwisowe)

1. W menu bocznym: **IAM & Admin** → **Service Accounts**
2. Kliknij **+ CREATE SERVICE ACCOUNT** (na górze)
3. Wypełnij formularz:
   - **Service account name**: `email-agent`
   - **Service account ID**: (zostaw auto-generowane)
   - **Description**: `Email Sequence Agent service account`
4. Kliknij **CREATE AND CONTINUE**
5. W sekcji **Grant this service account access to project**:
   - **Role**: kliknij pole, wyszukaj `Editor`
   - Wybierz **Editor**
6. Kliknij **CONTINUE**
7. Kliknij **DONE** (pomijamy opcjonalny krok 3)

### Krok 1.4: Pobierz klucz JSON

1. Na liście Service Accounts znajdź `email-agent@...`
2. Kliknij **trzy kropki** (⋮) po prawej stronie → **Manage keys**
3. Kliknij **ADD KEY** → **Create new key**
4. Wybierz typ **JSON**
5. Kliknij **CREATE**
6. Plik `email-agent-xxxxx.json` zostanie pobrany na Twój komputer

**⚠️ WAŻNE:** Ten plik zawiera klucze dostępu - nie udostępniaj go nikomu!

### Krok 1.5: Zapisz plik credentials

1. Otwórz pobrany plik JSON w edytorze (np. Notepad++)
2. Znajdź linię z `"client_email"` - skopiuj cały email (będzie potrzebny w kroku 2.3)
   ```json
   "client_email": "email-agent@xxxxx.iam.gserviceaccount.com"
   ```
3. Zachowaj ten plik - za chwilę go przerniesiemy

✅ **Checkpoint**: Masz pobrany plik JSON i skopiowany `client_email`

---

## CZĘŚĆ 2: Przygotowanie Google Sheets (10 min)

### Krok 2.1: Otwórz Twój arkusz Google Sheets

1. Przejdź do: **https://sheets.google.com/**
2. Możesz:
   - **Opcja A**: Użyć istniejącego arkusza o ID: `13CYoUh8BpVi4dOjeXrU1NFIt9PTVpKKhrdQGpggYzZ4`
     - Przejdź do: https://docs.google.com/spreadsheets/d/13CYoUh8BpVi4dOjeXrU1NFIt9PTVpKKhrdQGpggYzZ4/edit
   - **Opcja B**: Utworzyć nowy arkusz:
     - Kliknij **+ Blank** (pusty arkusz)
     - Nadaj mu nazwę np. **Email Leads**

### Krok 2.2: Utwórz zakładkę "Leads"

1. Na dole arkusza zobaczysz zakładki (np. "Sheet1")
2. Kliknij prawym przyciskiem na zakładkę → **Rename**
3. Zmień nazwę na: `Leads`
4. Naciśnij Enter

### Krok 2.3: Skopiuj nagłówki kolumn

W **wierszu 1** (pierwszym wierszu) wklej następujące nagłówki:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| email | firma | website_url | imie | generuj | status | research_notes | research_sources | research_date |

Dalsze kolumny (J-Z) możesz zobaczyć w pliku `docs/GOOGLE_SHEETS_TEMPLATE.md`, ale na start wystarczą te podstawowe.

**Szybsza metoda - skopiuj całą linię:**
```
email	firma	website_url	imie	generuj	status	research_notes	research_sources	research_date	step1_subject	step1_body	step1_sent_date	step1_message_id	step2_subject	step2_body	step2_sent_date	step2_message_id	step3_subject	step3_body	step3_sent_date	step3_message_id	reply_received	reply_date	last_check	notatki	created_at
```
(Wklej w wierszu 1, kolumny rozdzielą się automatycznie)

### Krok 2.4: Udostępnij arkusz Service Account

1. Kliknij przycisk **Share** (Udostępnij) w prawym górnym rogu
2. W pole **Add people and groups** wklej email Service Account który skopiowałeś w kroku 1.5:
   ```
   email-agent@xxxxx.iam.gserviceaccount.com
   ```
3. Upewnij się że rola to: **Editor**
4. **ODZNACZ** checkbox "Notify people" (nie wysyłaj powiadomienia)
5. Kliknij **Share** / **Done**

### Krok 2.5: Skopiuj ID arkusza

1. Spojrzyj na URL arkusza w przeglądarce:
   ```
   https://docs.google.com/spreadsheets/d/13CYoUh8BpVi4dOjeXrU1NFIt9PTVpKKhrdQGpggYzZ4/edit
   ```
2. Skopiuj część między `/d/` a `/edit` - to jest **Spreadsheet ID**:
   ```
   13CYoUh8BpVi4dOjeXrU1NFIt9PTVpKKhrdQGpggYzZ4
   ```
3. Zapisz to ID - będzie potrzebne w konfiguracji

✅ **Checkpoint**: Arkusz ma zakładkę "Leads", nagłówki i jest udostępniony Service Account

---

## CZĘŚĆ 3: Konto Anthropic (Claude AI) (5 min)

### Krok 3.1: Zarejestruj się

1. Przejdź do: **https://console.anthropic.com/**
2. Kliknij **Sign Up**
3. Zarejestruj się przez:
   - Email + hasło, LUB
   - Konto Google
4. Potwierdź email (jeśli rejestracja przez email)

### Krok 3.2: Dodaj kartę płatniczą

1. W konsoli Anthropic przejdź do: **Settings** → **Billing**
2. Kliknij **Add payment method**
3. Wprowadź dane karty
4. Zapisz

**💰 Koszt:** Pierwszy miesiąc dostaniesz $5 darmowych kredytów. Jeden research + sekwencja kosztuje ~$0.05-0.10.

### Krok 3.3: Utwórz API Key

1. W konsoli przejdź do: **API Keys** (menu boczne)
2. Kliknij **+ Create Key**
3. Nazwij klucz: `Email Sequence Agent`
4. Kliknij **Create Key**
5. **⚠️ SKOPIUJ KLUCZ TERAZ** - nie będziesz mógł go ponownie zobaczyć!
   ```
   sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
6. Zapisz klucz w bezpiecznym miejscu (np. Notatnik)

✅ **Checkpoint**: Masz API key zaczynający się od `sk-ant-api03-`

---

## CZĘŚĆ 4: Instalacja i konfiguracja aplikacji (10 min)

### Krok 4.1: Pobierz kod (jeśli jeszcze nie masz)

```bash
# Jeśli masz repozytorium sklonowane, pomiń ten krok
git clone https://github.com/twoje-repo/Mich.git
cd Mich/email-sequence-agent
```

**LUB jeśli kod jest już na dysku:**
```bash
cd /ścieżka/do/email-sequence-agent
```

### Krok 4.2: Zainstaluj dependencies

```bash
cd backend
npm install
```

To zajmie ~2-3 minuty. Zobaczysz listę instalowanych pakietów.

Poczekaj aż zobaczysz:
```
added XXX packages
```

### Krok 4.3: Przenieś plik credentials

Skopiuj pobrany wcześniej plik JSON:

**Windows:**
```bash
mkdir credentials
copy C:\Users\TwojeImie\Downloads\email-agent-xxxxx.json credentials\google-credentials.json
```

**Mac/Linux:**
```bash
mkdir -p credentials
cp ~/Downloads/email-agent-xxxxx.json credentials/google-credentials.json
```

**LUB ręcznie:**
1. Utwórz folder `credentials` w folderze `backend`
2. Skopiuj tam plik JSON
3. Zmień nazwę na: `google-credentials.json`

### Krok 4.4: Skopiuj plik konfiguracyjny

```bash
cp .env.example .env
```

### Krok 4.5: Edytuj konfigurację

Otwórz plik `.env` w edytorze (np. Notepad++, VS Code):

```bash
# Windows
notepad .env

# Mac
open -e .env

# Linux
nano .env
```

**NIE MUSISZ** wypełniać nic w pliku `.env` - możesz to zrobić przez dashboard!

Ale jeśli chcesz, możesz już teraz wpisać:
```env
# Spreadsheet ID z kroku 2.5
GOOGLE_SPREADSHEET_ID=13CYoUh8BpVi4dOjeXrU1NFIt9PTVpKKhrdQGpggYzZ4

# Twój email testowy
TEST_EMAIL=twoj-email@example.com

# Start w trybie testowym!
DRY_RUN=true

# API key z Anthropic (opcjonalne - możesz dodać przez dashboard)
# ANTHROPIC_API_KEY=sk-ant-api03-...
```

Zapisz i zamknij plik.

✅ **Checkpoint**: Plik `.env` istnieje, credentials w folderze, npm install zakończone

---

## CZĘŚĆ 5: Pierwsze uruchomienie! (5 min)

### Krok 5.1: Uruchom serwer

```bash
# Upewnij się że jesteś w folderze backend
cd backend  # jeśli nie jesteś

# Uruchom
npm run dev
```

Zobaczysz:
```
🚀 Email Sequence Agent - Starting...

Configuration:
  Spreadsheet ID: 13CYoUh8BpVi4dOjeXrU1NFIt9PTVpKKhrdQGpggYzZ4
  Sheet Name: Leads
  Sender: Michał Sławiński <michal@mayiawebsite.pl>
  Dry Run: true
  Test Email: twoj-email@example.com
  ...

✅ Google Auth initialized
⏰ Starting scheduler: every 5 minutes
✅ Scheduler started!

🌐 Server running on http://localhost:3002
📊 Dashboard: http://localhost:3002
```

### Krok 5.2: Otwórz Dashboard

1. Otwórz przeglądarkę
2. Przejdź do: **http://localhost:3002**

Zobaczysz dashboard systemu! 🎉

### Krok 5.3: Wklej API Key przez Dashboard

1. W sekcji **🔑 API Configuration** zobaczysz formularz
2. Wklej swój Anthropic API Key (ten który zaczyna się od `sk-ant-api03-`)
3. Wklej swój test email (na który będą wysyłane testowe emaile)
4. Kliknij **💾 Zapisz API Key**
5. Poczekaj 2 sekundy - strona się odświeży
6. Sprawdź czy status pokazuje **✓ Ustawiony**

✅ **Checkpoint**: Dashboard działa, API key wklejony, status OK

---

## CZĘŚĆ 6: Pierwszy test! (5 min)

### Krok 6.1: Dodaj testowego leada do Google Sheets

1. Otwórz swój arkusz Google Sheets
2. W wierszu 2 (pierwszy wiersz danych) wpisz:

| A (email) | B (firma) | C (website_url) | D (imie) | E (generuj) |
|-----------|-----------|-----------------|----------|-------------|
| test@example.com | Test Company | https://example.com | Jan | TRUE |

**Kolumna E (generuj)** - wpisz słowo `TRUE` lub zaznacz checkbox (jeśli Google Sheets pokazuje checkbox)

### Krok 6.2: Poczekaj (max 5 minut)

System działa automatycznie co 5 minut. Obserwuj logi w terminalu gdzie uruchomiłeś `npm run dev`.

Za chwilę zobaczysz:
```
🔍 === PROCESSING RESEARCH ===
📊 Researching: Test Company (test@example.com)
✅ Research completed for Test Company

📧 === PROCESSING SEQUENCE GENERATION ===
✉️  Generating sequence: Test Company (test@example.com)
✅ Sequence generated for Test Company

📤 === PROCESSING SENDING ===
📨 Sending Step 1 to test@example.com (Test Company)
🧪 DRY RUN: Would send to test@example.com, but sending to twoj-email@example.com instead
✅ Step 1 sent to test@example.com
```

### Krok 6.3: Sprawdź email!

1. Otwórz swoją skrzynkę email (`TEST_EMAIL`)
2. Powinieneś otrzymać email z sekwencją! 📧

### Krok 6.4: Sprawdź Google Sheets

1. Odśwież arkusz
2. W wierszu 2 zobaczysz wypełnione kolumny:
   - **F (status)**: `wysłane`
   - **G (research_notes)**: JSON z wynikami researchu
   - **J (step1_subject)**: Temat pierwszego emaila
   - **K (step1_body)**: Treść pierwszego emaila
   - **L (step1_sent_date)**: Data wysłania

---

## 🎉 GRATULACJE! System działa!

Właśnie skonfigurowałeś i uruchomiłeś kompleksowy system automatyzacji emaili z AI!

---

## Co dalej?

### Dodaj prawdziwych leadów

1. Otwórz Google Sheets
2. Dodaj wiersze z danymi:
   - Email prospektu
   - Nazwa firmy
   - Link do strony WWW
   - Imię kontaktu
   - Zaznacz TRUE w kolumnie `generuj`

### Wyłącz Dry Run (gdy będziesz gotowy)

1. Otwórz Dashboard: http://localhost:3002
2. W sekcji **🔑 API Configuration**:
   - Zmień `DRY_RUN` na `false` w pliku `.env`
   - **LUB** zatrzymaj serwer (Ctrl+C) i uruchom ponownie z `.env` ustawionym na `DRY_RUN=false`

**⚠️ UWAGA**: Po wyłączeniu Dry Run emaile będą wysyłane do PRAWDZIWYCH adresatów!

### Monitoruj system

- **Dashboard**: http://localhost:3002
- **Logi**: Terminal gdzie uruchomiłeś `npm run dev`
- **Google Sheets**: Statusy leadów

---

## 🐛 Problemy? Sprawdź troubleshooting

### "Google Auth failed"

**Rozwiązanie:**
1. Sprawdź czy plik `credentials/google-credentials.json` istnieje
2. Sprawdź czy Service Account ma dostęp do arkusza (Share)
3. Sprawdź czy włączyłeś Google Sheets API i Gmail API

### "ANTHROPIC_API_KEY not set"

**Rozwiązanie:**
1. Przejdź do Dashboard: http://localhost:3002
2. Wklej API key w sekcji **🔑 API Configuration**
3. Kliknij **Zapisz API Key**

### "Outside sending hours"

**Rozwiązanie:**
System wysyła tylko w godzinach 9-18, Pon-Pt.

Aby zmienić, edytuj `.env`:
```env
SEND_HOUR_START=0
SEND_HOUR_END=23
SEND_WEEKENDS=true
```

### Nie działa wklejanie API przez dashboard

**Rozwiązanie:**
Dodaj API key do pliku `.env`:
```env
ANTHROPIC_API_KEY=sk-ant-api03-twoj_klucz
```

Restartuj serwer (Ctrl+C i `npm run dev`)

---

## 📚 Przydatne linki

- [README.md](./README.md) - Główna dokumentacja
- [QUICK_START.md](./QUICK_START.md) - Szybki start (20 min)
- [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) - Setup techniczny
- [docs/GOOGLE_SHEETS_TEMPLATE.md](./docs/GOOGLE_SHEETS_TEMPLATE.md) - Wszystkie kolumny
- [docs/API_EXAMPLES.md](./docs/API_EXAMPLES.md) - Przykłady API

---

## 💬 Potrzebujesz pomocy?

Jeśli coś nie działa:
1. Sprawdź logi w terminalu
2. Sprawdź Dashboard: http://localhost:3002/api/health
3. Zobacz troubleshooting powyżej
4. Zajrzyj do dokumentacji

---

**Powodzenia! 🚀**
