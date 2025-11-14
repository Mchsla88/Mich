# Excel CRM z Gemini AI Research

Aplikacja CRM z interfejsem podobnym do Excel, która automatycznie wykonuje research firm i generuje sekwencje emaili przy użyciu Google Gemini AI.

## Funkcje

✨ **Interfejs Excel-like** - Edytowalna tabela z wszystkimi funkcjami (sortowanie, filtrowanie, paginacja)

🤖 **Automatyczny Research** - AI automatycznie zbiera informacje o firmach

📧 **Generowanie Emaili** - Automatyczne tworzenie sekwencji 3 emaili na podstawie researchu

💾 **Import/Export** - Zapisywanie i wczytywanie danych w formacie JSON

## Kolumny CRM

- **Imię i Nazwisko** - Nazwa kontaktu
- **Email** - Adres email kontaktu
- **Firma** - Nazwa firmy
- **Strona WWW** - URL strony firmy
- **Stanowisko** - Pozycja kontaktu w firmie
- **Prompt Research** - Instrukcje dla AI jak wykonać research
- **Prompt Sekwencja** - Instrukcje dla AI jak wygenerować emaile
- **Research Results** - Wyniki researchu (automatycznie wypełniane)
- **Status** - Status przetwarzania (Draft, Generate, Researching, Generating Emails, Complete)
- **Email 1, 2, 3** - Wygenerowane emaile (automatycznie wypełniane)
- **Data Email 1, 2, 3** - Daty generowania emaili
- **Notatki** - Dodatkowe notatki

## Workflow

1. **Wypełnij dane** - Wprowadź podstawowe informacje (Firma/Strona WWW/Email)
2. **Ustaw prompty** - Dostosuj prompty research i sekwencji (opcjonalnie - są domyślne)
3. **Zmień status na "Generate"** - Kliknij w kolumnę Status i wybierz "Generate"
4. **Automatyzacja** - AI automatycznie:
   - Wykona research firmy (status: Researching)
   - Wygeneruje 3 emaile (status: Generating Emails)
   - Oznaczy jako Complete

## Instalacja

### Wymagania
- Node.js 18+
- Klucz API Google Gemini ([uzyskaj tutaj](https://makersuite.google.com/app/apikey))

### Krok 1: Instalacja zależności

```bash
cd excel-crm-gemini
npm run install:all
```

### Krok 2: Konfiguracja Gemini API

Utwórz plik `.env` w folderze `backend`:

```bash
cd backend
cp .env.example .env
```

Edytuj plik `.env` i dodaj swój klucz API:

```
GEMINI_API_KEY=twoj_klucz_api_tutaj
PORT=3001
```

### Krok 3: Uruchomienie aplikacji

Z głównego folderu uruchom:

```bash
npm run dev
```

To uruchomi:
- Frontend na `http://localhost:5173`
- Backend na `http://localhost:3001`

## Użycie

### Dodawanie nowego kontaktu

1. Kliknij przycisk **"Dodaj wiersz"**
2. Wypełnij pola: Imię i Nazwisko, Email, Firma, Strona WWW, Stanowisko
3. Dostosuj prompty (opcjonalnie):
   - **Prompt Research**: instrukcje jak AI ma zbadać firmę
   - **Prompt Sekwencja**: instrukcje jak AI ma stworzyć emaile
4. Zmień **Status** na **"Generate"**
5. Poczekaj na automatyczne przetworzenie (10-30 sekund)

### Prompty domyślne

**Prompt Research (domyślny):**
```
Znajdź informacje o tej firmie: jej produktach, usługach,
ostatnich aktualnościach i kluczowych osobach.
```

**Prompt Sekwencja (domyślny):**
```
Napisz profesjonalną sekwencję 3 emaili do potencjalnego klienta,
każdy kolejny bardziej przekonujący.
```

### Eksport/Import danych

- **Eksportuj JSON**: Zapisuje wszystkie dane do pliku JSON
- **Importuj JSON**: Wczytuje dane z wcześniej zapisanego pliku

## Struktura projektu

```
excel-crm-gemini/
├── frontend/              # React + TypeScript + AG Grid
│   ├── src/
│   │   ├── App.tsx       # Główny komponent aplikacji
│   │   ├── types.ts      # Typy TypeScript
│   │   └── ...
│   └── package.json
├── backend/               # Express + TypeScript + Gemini AI
│   ├── src/
│   │   ├── index.ts      # Serwer Express
│   │   ├── gemini.ts     # Integracja z Gemini API
│   │   ├── types.ts      # Typy TypeScript
│   │   └── ...
│   └── package.json
└── package.json          # Główny package.json (workspaces)
```

## API Endpoints

### POST /api/research
Wykonuje research firmy przez Gemini AI

**Request:**
```json
{
  "rowId": "uuid",
  "company": "Nazwa firmy",
  "website": "https://firma.pl",
  "email": "kontakt@firma.pl",
  "promptResearch": "Instrukcje dla AI"
}
```

**Response:**
```json
{
  "rowId": "uuid",
  "researchResults": "Wyniki researchu...",
  "success": true
}
```

### POST /api/generate-emails
Generuje sekwencję 3 emaili

**Request:**
```json
{
  "rowId": "uuid",
  "researchResults": "Wyniki researchu...",
  "promptSequence": "Instrukcje dla AI",
  "recipientName": "Jan Kowalski",
  "recipientEmail": "jan@firma.pl",
  "company": "Firma Sp. z o.o."
}
```

**Response:**
```json
{
  "rowId": "uuid",
  "email1": "Treść emaila 1...",
  "email2": "Treść emaila 2...",
  "email3": "Treść emaila 3...",
  "success": true
}
```

## Technologie

- **Frontend**: React 18, TypeScript, AG Grid, Vite, Axios
- **Backend**: Node.js, Express, TypeScript, Google Gemini AI
- **Styling**: CSS, AG Grid Theme

## Uwagi

- Aplikacja **NIE wysyła emaili** - tylko je generuje
- Wszystkie dane są przechowywane lokalnie w przeglądarce
- Eksportuj dane regularnie aby nie stracić pracy
- Gemini API może mieć limity wywołań (sprawdź w Google AI Studio)

## Licencja

MIT

## Autor

Stworzono przez Claude Code dla projektu Mich
