# Google Sheets Template dla Email Sequence Agent

## Spreadsheet ID
```
13CYoUh8BpVi4dOjeXrU1NFIt9PTVpKKhrdQGpggYzZ4
```

## Nazwa zakładki
```
Leads
```

## Struktura kolumn (nagłówki w wierszu 1)

| Kolumna | Typ | Opis | Przykład |
|---------|-----|------|----------|
| A: `email` | Email | Adres email prospektu | `jan.kowalski@firma.pl` |
| B: `firma` | Text | Nazwa firmy | `Firma XYZ Sp. z o.o.` |
| C: `website_url` | URL | Link do strony WWW | `https://firma-xyz.pl` |
| D: `imie` | Text | Imię kontaktu | `Jan` |
| E: `generuj` | Checkbox | Trigger - zaznacz aby rozpocząć | `TRUE`/`FALSE` |
| F: `status` | Text | Status leada | `nowy`, `research`, `sekwencja`, `wysłane`, `odpowiedź`, `zakończone` |
| G: `research_notes` | Long Text | Wyniki audytu WWW (JSON) | `{"summary": "..."}` |
| H: `research_sources` | Text | Źródła z audytu | `https://...` |
| I: `research_date` | Date | Data wykonania research | `2025-11-12 14:30` |
| J: `step1_subject` | Text | Temat email 1 | `[Firma] x wydajność strony WWW` |
| K: `step1_body` | Long Text | Treść email 1 (HTML) | `<p>Dzień dobry Jan,</p>...` |
| L: `step1_sent_date` | DateTime | Data wysłania email 1 | `2025-11-12 10:15` |
| M: `step1_message_id` | Text | Gmail Message ID (thread) | `<abc123@mail.gmail.com>` |
| N: `step2_subject` | Text | Temat email 2 | `Re: [Firma] x wydajność...` |
| O: `step2_body` | Long Text | Treść email 2 (HTML) | `<p>Dzień dobry,</p>...` |
| P: `step2_sent_date` | DateTime | Data wysłania email 2 | `2025-11-15 11:00` |
| Q: `step2_message_id` | Text | Gmail Message ID | `<def456@mail.gmail.com>` |
| R: `step3_subject` | Text | Temat email 3 | `Re: [Firma] x wydajność...` |
| S: `step3_body` | Long Text | Treść email 3 (HTML) | `<p>Dzień dobry,</p>...` |
| T: `step3_sent_date` | DateTime | Data wysłania email 3 | `2025-11-19 14:30` |
| U: `step3_message_id` | Text | Gmail Message ID | `<ghi789@mail.gmail.com>` |
| V: `reply_received` | Checkbox | Czy otrzymano odpowiedź | `TRUE`/`FALSE` |
| W: `reply_date` | DateTime | Data otrzymania odpowiedzi | `2025-11-13 16:45` |
| X: `last_check` | DateTime | Ostatnie sprawdzenie | `2025-11-12 20:00` |
| Y: `notatki` | Long Text | Dodatkowe notatki | Opcjonalne uwagi |
| Z: `created_at` | DateTime | Data dodania | `2025-11-12 09:00` |

## Jak używać

### 1. Przygotowanie arkusza
1. Otwórz Google Sheets: https://docs.google.com/spreadsheets/d/13CYoUh8BpVi4dOjeXrU1NFIt9PTVpKKhrdQGpggYzZ4/edit
2. Dodaj zakładkę o nazwie `Leads` (jeśli nie istnieje)
3. Skopiuj nagłówki z tabeli powyżej do wiersza 1

### 2. Dodawanie nowego leada
1. Wypełnij kolumny A-D (email, firma, website_url, imie)
2. Zostaw kolumnę E (`generuj`) pustą lub FALSE
3. Kolumna F (`status`) automatycznie ustawi się na `nowy`

### 3. Uruchomienie sekwencji
1. Zaznacz checkbox w kolumnie E (`generuj`) → ustaw na TRUE
2. System automatycznie (w ciągu 5 minut):
   - Wykona research strony WWW
   - Wygeneruje 3-krokową sekwencję emaili
   - Rozpocznie wysyłkę wg harmonogramu

### 4. Monitorowanie
- Kolumna F (`status`) pokazuje aktualny stan
- Kolumny L, P, T pokazują daty wysłania poszczególnych emaili
- Kolumna V (`reply_received`) automatycznie zaznaczy się gdy klient odpowie

### 5. Zatrzymanie sekwencji
- Odznacz checkbox w kolumnie E (`generuj`) → ustaw na FALSE
- LUB system automatycznie zatrzyma gdy `reply_received` = TRUE

## Formaty danych

### Status (kolumna F)
- `nowy` - Lead dodany, oczekuje na research
- `research` - W trakcie analizy strony WWW
- `sekwencja` - Sekwencja wygenerowana, oczekuje na wysyłkę
- `wysłane` - Co najmniej 1 email wysłany
- `odpowiedź` - Otrzymano odpowiedź od klienta (STOP)
- `zakończone` - Wszystkie 3 emaile wysłane lub przerwane

### Research Notes (kolumna G) - format JSON
```json
{
  "summary": "Krótkie podsumowanie audytu (2-3 zdania)",
  "issues": [
    {
      "area": "Performance",
      "finding": "Problem z wydajnością",
      "evidence": "Gdzie widoczne",
      "impact": "Wpływ na biznes",
      "confidence": "wysokie"
    }
  ],
  "quick_wins": [
    "Szybka poprawa 1",
    "Szybka poprawa 2"
  ],
  "sources": ["https://..."]
}
```

## Przykładowy wiersz

| email | firma | website_url | imie | generuj | status |
|-------|-------|-------------|------|---------|--------|
| jan.kowalski@abc.pl | ABC Corp | https://abc-corp.pl | Jan | ☑ | sekwencja |

## Limity i harmonogram

- **Limity wysyłek**: 10/godzinę, 50/dzień
- **Godziny wysyłki**: 09:00-18:00 (Europe/Warsaw)
- **Dni**: Poniedziałek-Piątek (bez weekendów)
- **Harmonogram sekwencji**:
  - Email 1: Day 0 (natychmiast po wygenerowaniu)
  - Email 2: Day +3 (3 dni po email 1)
  - Email 3: Day +7 (7 dni po email 1)
- **Sprawdzanie**: Co 5 minut

## Uwagi

- Wszystkie daty w strefie czasowej: `Europe/Warsaw`
- Polskie znaki (ą, ć, ę, ł, ń, ó, ś, ź, ż) są wspierane
- Research szuka informacji nie starszych niż 90 dni
- Thread emailowy zachowany (Reply-To tego samego wątku)
