# Jak nadać dostęp do Google Sheets dla aplikacji

Po skonfigurowaniu Google Service Account musisz nadać mu dostęp do każdego arkusza Google Sheets, z którego aplikacja ma czytać leady.

## Krok 1: Znajdź email Service Account

1. Otwórz plik `credentials/google-credentials.json`
2. Znajdź pole `"client_email"`
3. Skopiuj adres email (wygląda jak: `nazwa-projektu@projekt-id.iam.gserviceaccount.com`)

**Przykład:**
```json
{
  "type": "service_account",
  "project_id": "email-agent-123456",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "email-agent@email-agent-123456.iam.gserviceaccount.com",
  ...
}
```

W tym przykładzie email to: `email-agent@email-agent-123456.iam.gserviceaccount.com`

## Krok 2: Nadaj dostęp do arkusza

1. **Otwórz Google Sheets** z leadami
2. **Kliknij "Udostępnij"** (przycisk w prawym górnym rogu)
3. **Wklej email Service Account** w pole "Dodaj osoby i grupy"
4. **Ustaw uprawnienia: "Edytor"** (aplikacja musi móc zapisywać dane)
5. **ODZNACZ** opcję "Powiadom osoby" (Service Account nie czyta emaili)
6. **Kliknij "Udostępnij"**

## Krok 3: Sprawdź dostęp

Po uruchomieniu aplikacji sprawdź logi:
- ✅ `Google Auth initialized successfully` - dostęp OK
- ❌ `Failed to initialize Google Auth` - problem z credentials
- ❌ Błędy przy odczycie arkusza - brak dostępu do konkretnego arkusza

## Powtórz dla każdego arkusza

Jeśli używasz wielu arkuszy (różne kampanie, różne nadawcy), **musisz nadać dostęp do każdego arkusza osobno**.

## Przykład: 3 różne kampanie

| Kampania | Arkusz Google Sheets | Service Account Email | Dostęp |
|----------|---------------------|----------------------|--------|
| Web Design | `spreadsheet-id-1` | `email-agent@...iam.gserviceaccount.com` | ✅ Edytor |
| SEO Services | `spreadsheet-id-2` | `email-agent@...iam.gserviceaccount.com` | ✅ Edytor |
| E-commerce | `spreadsheet-id-3` | `email-agent@...iam.gserviceaccount.com` | ✅ Edytor |

Ten sam Service Account może mieć dostęp do wielu arkuszy!

## Rozwiązywanie problemów

### Problem: "The caller does not have permission"

**Przyczyna:** Service Account nie ma dostępu do arkusza

**Rozwiązanie:**
1. Sprawdź czy email Service Account jest poprawny
2. Upewnij się że nadałeś uprawnienia "Edytor" (nie "Czytelnik")
3. Sprawdź czy ID arkusza w konfiguracji jest poprawne

### Problem: "Requested entity was not found"

**Przyczyna:** Nieprawidłowe ID arkusza lub arkusz nie istnieje

**Rozwiązanie:**
1. Sprawdź ID arkusza w URL: `https://docs.google.com/spreadsheets/d/[TO_JEST_ID]/edit`
2. Upewnij się że arkusz istnieje i nie został usunięty
3. Sprawdź czy nazwa zakładki (sheet name) jest poprawna

### Problem: "Invalid grant: account not found"

**Przyczyna:** Nieprawidłowy plik credentials lub Service Account został usunięty

**Rozwiązanie:**
1. Pobierz nowy plik JSON z Google Cloud Console
2. Zastąp `credentials/google-credentials.json`
3. Zrestartuj aplikację

## Bezpieczeństwo

⚠️ **NIGDY nie commituj pliku `google-credentials.json` do repozytorium Git!**

Plik `.gitignore` już zawiera wpis dla `credentials/`, ale upewnij się że:
```bash
git status
```

NIE pokazuje pliku `google-credentials.json` w "Changes to be committed".

## Następne kroki

Po nadaniu dostępu do arkuszy:
1. Dodaj arkusze przez dashboard (http://localhost:3002)
2. Każdy arkusz może mieć:
   - Inny email nadawcy
   - Inną nazwę nadawcy
   - Inną stopkę HTML
3. Uruchom scheduler lub przetwarzanie manualne
4. Sprawdź logi czy wszystko działa poprawnie

---

**Potrzebujesz pomocy?** Sprawdź pełną instrukcję w `INSTRUKCJA_URUCHOMIENIA.md`
