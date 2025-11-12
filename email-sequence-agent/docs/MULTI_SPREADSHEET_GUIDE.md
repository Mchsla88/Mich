# 📚 Przewodnik: Wiele Arkuszy (Multi-Spreadsheet)

## 🎯 Co to jest?

System obsługuje teraz **wiele arkuszy Google Sheets jednocześnie**, gdzie każdy arkusz może mieć:
- ✅ Własny email nadawcy
- ✅ Własną nazwę nadawcy
- ✅ Osobną kampanię/klienta
- ✅ Niezależne zarządzanie

## 🚀 Przykładowe zastosowania

### Przypadek 1: Różne usługi
```
Arkusz 1: "Kampania Web Design"
├── Email: michal@mayiawebsite.pl
├── Nadawca: Michał Sławiński
└── Leady: 20 prospektów stron WWW

Arkusz 2: "Kampania SEO"
├── Email: jan@seo-agency.pl
├── Nadawca: Jan Kowalski
└── Leady: 30 prospektów SEO

Arkusz 3: "Kampania E-commerce"
├── Email: anna@eshop-expert.pl
├── Nadawca: Anna Nowak
└── Leady: 15 prospektów e-commerce
```

### Przypadek 2: Różni klienci
```
Arkusz 1: "Klient A - Agencja X"
├── Email: contact@agencja-x.pl
└── Leady: klienci Agencji X

Arkusz 2: "Klient B - Firma Y"
├── Email: hello@firma-y.pl
└── Leady: klienci Firmy Y
```

---

## 📖 Jak używać

### Krok 1: Utwórz nowy arkusz Google Sheets

1. Przejdź do: https://sheets.google.com/
2. Utwórz nowy pusty arkusz
3. Nazwij go np. **"Kampania SEO - Leady"**
4. Dodaj zakładkę o nazwie **Leads** (lub inną)
5. Skopiuj nagłówki z template (patrz: `GOOGLE_SHEETS_TEMPLATE.md`)
6. **Skopiuj ID arkusza** z URL:
   ```
   https://docs.google.com/spreadsheets/d/1ABC...XYZ/edit
                                            ^^^^^^^^^
                                            To jest ID
   ```

### Krok 2: Udostępnij arkusz Service Account

1. Kliknij **Share** w arkuszu
2. Dodaj email Service Account (ten sam co w pierwszym arkuszu):
   ```
   email-agent@twoj-projekt.iam.gserviceaccount.com
   ```
3. Uprawnienia: **Editor**
4. Kliknij **Share**

### Krok 3: Dodaj arkusz w Dashboardzie

1. Otwórz: http://localhost:3002
2. Znajdź sekcję **📚 Zarządzanie Arkuszami**
3. Kliknij **➕ Dodaj nowy arkusz**
4. Wypełnij formularz:
   - **Google Spreadsheet ID**: (skopiowane z URL)
   - **Nazwa zakładki**: `Leads`
   - **Nazwa kampanii**: `Kampania SEO`
   - **Email nadawcy**: `jan@seo-agency.pl`
   - **Nazwa nadawcy**: `Jan Kowalski`
5. Kliknij **💾 Dodaj arkusz**

### Krok 4: Dodaj leady do nowego arkusza

1. Otwórz nowy arkusz Google Sheets
2. Dodaj leady (email, firma, website_url, imie)
3. Zaznacz checkbox w kolumnie **generuj** (E)
4. System automatycznie zacznie przetwarzać!

---

## ⚙️ Zarządzanie arkuszami

### Lista arkuszy

W dashboardzie zobaczysz wszystkie dodane arkusze:
```
┌─────────────────────────────────────────┐
│ 📚 Zarządzanie Arkuszami                │
├─────────────────────────────────────────┤
│                                          │
│ Kampania Web Design       [✓ Aktywny]   │
│ 📧 Michał Sławiński <michal@...>        │
│ 📊 Sheet: Leads                          │
│ 🆔 ID: 13CYoUh8Bp...                    │
│   [⏸️ Dezaktywuj] [🗑️ Usuń]            │
│                                          │
│ Kampania SEO             [✓ Aktywny]    │
│ 📧 Jan Kowalski <jan@...>               │
│   [⏸️ Dezaktywuj] [🗑️ Usuń]            │
└─────────────────────────────────────────┘
```

### Aktywacja / Dezaktywacja

- **Aktywny** - system przetwarza leady z tego arkusza
- **Nieaktywny** - system pomija ten arkusz

Kliknij **⏸️ Dezaktywuj** żeby tymczasowo wyłączyć arkusz (np. kampania zakończona).

### Usuwanie

Kliknij **🗑️ Usuń** żeby całkowicie usunąć arkusz z systemu.

⚠️ **Uwaga**: To nie usuwa arkusza z Google Sheets, tylko z konfiguracji systemu!

---

## 🔄 Jak to działa wewnętrznie

### Cykl przetwarzania (co 5 minut)

```
1. System ładuje wszystkie AKTYWNE arkusze
         ↓
2. Dla każdego arkusza:
   ├─ Wczytuje leady (gdzie generuj=TRUE)
   ├─ Wykonuje research (jeśli potrzebny)
   ├─ Generuje sekwencje emaili
   └─ Wysyła emaile z WŁAŚCIWEGO adresu nadawcy
         ↓
3. Monitoruje odpowiedzi
         ↓
4. Aktualizuje statusy w arkuszach
```

### Przykład wysyłki

Jeśli masz 2 arkusze:

**Arkusz 1**: Kampania Web Design (`michal@mayiawebsite.pl`)
- Lead A: `klient1@firma.pl` → Email wysłany z `michal@mayiawebsite.pl`
- Lead B: `klient2@startup.pl` → Email wysłany z `michal@mayiawebsite.pl`

**Arkusz 2**: Kampania SEO (`jan@seo-agency.pl`)
- Lead C: `klient3@biznes.pl` → Email wysłany z `jan@seo-agency.pl`
- Lead D: `klient4@shop.pl` → Email wysłany z `jan@seo-agency.pl`

**Każda kampania ma swój własny email! 🎉**

---

## 🔐 Bezpieczeństwo i dostępy

### Gmail API - Delegation

Jeśli chcesz wysyłać z różnych adresów email, musisz skonfigurować **Gmail delegation** lub **osobne Service Accounts**.

#### Opcja A: Gmail Delegation (łatwiejsza)

1. Twój Service Account może wysyłać w imieniu wszystkich emaili w Twojej domenie Google Workspace
2. Skonfiguruj delegation w Google Workspace Admin Console
3. [Guide tutaj](https://developers.google.com/identity/protocols/oauth2/service-account#delegatingauthority)

#### Opcja B: Osobne Service Accounts

1. Utwórz osobny Service Account dla każdego emaila
2. Podaj osobny plik credentials dla każdego
3. Bardziej skomplikowane, ale bardziej izolowane

### SPF/DKIM

Upewnij się że masz poprawnie skonfigurowane:
- **SPF** - dla domeny nadawcy
- **DKIM** - podpis cyfrowy
- **DMARC** - polityka autentykacji

Bez tego Twoje emaile mogą trafiać do SPAMu!

---

## 📊 API Endpoints

### Pobierz wszystkie arkusze
```bash
GET /api/spreadsheets
```

Response:
```json
{
  "success": true,
  "count": 2,
  "spreadsheets": [
    {
      "id": "abc-123",
      "spreadsheetId": "13CYoUh8Bp...",
      "sheetName": "Leads",
      "senderEmail": "michal@mayiawebsite.pl",
      "senderName": "Michał Sławiński",
      "name": "Kampania Web Design",
      "active": true,
      "createdAt": "2025-11-12T20:00:00Z",
      "updatedAt": "2025-11-12T20:00:00Z"
    }
  ]
}
```

### Dodaj nowy arkusz
```bash
POST /api/spreadsheets
Content-Type: application/json

{
  "spreadsheetId": "13CYoUh8Bp...",
  "sheetName": "Leads",
  "senderEmail": "jan@seo.pl",
  "senderName": "Jan Kowalski",
  "name": "Kampania SEO",
  "active": true
}
```

### Aktywuj/Dezaktywuj
```bash
POST /api/spreadsheets/{id}/toggle
```

### Usuń arkusz
```bash
DELETE /api/spreadsheets/{id}
```

---

## 🐛 Troubleshooting

### Błąd: "Permission denied" przy wysyłce

**Problem**: Service Account nie ma uprawnień do wysyłania z danego emaila.

**Rozwiązanie**:
1. Sprawdź czy email jest w tej samej domenie co Google Workspace
2. Skonfiguruj Gmail delegation (patrz wyżej)
3. Lub użyj osobnego Service Account

### Arkusz nie jest przetwarzany

**Sprawdź**:
1. Czy arkusz jest **Aktywny** (zielony badge)
2. Czy Service Account ma dostęp do arkusza (Share)
3. Czy w arkuszu są leady z `generuj=TRUE`
4. Czy scheduler działa (Dashboard → Scheduler → Start)

### Emaile wysyłane z złego adresu

**Problem**: Wszystkie emaile idą z jednego adresu mimo różnych konfiguracji.

**Rozwiązanie**:
1. Sprawdź czy Gmail delegation jest poprawnie skonfigurowane
2. Sprawdź logi w konsoli - powinny pokazać "from {email}"
3. Zrestartuj serwer

---

## 💡 Best Practices

### 1. Organizacja arkuszy

Nazwij arkusze jasno:
- ✅ **"2025-Q1 - Web Design - B2B"**
- ✅ **"Klient ABC - Kampania SEO"**
- ❌ **"Arkusz1"** (niejasne)

### 2. Testowanie

Przed uruchomieniem kampanii:
1. Dodaj arkusz jako **Nieaktywny**
2. Dodaj 1-2 testowe leady z Twoim emailem
3. Aktywuj arkusz
4. Sprawdź czy emaile przychodzą poprawnie
5. Dezaktywuj, popraw błędy jeśli są
6. Aktywuj ponownie dla prawdziwych leadów

### 3. Limity

Pamiętaj o limitach:
- **10 emaili/godzinę**
- **50 emaili/dzień**

Jeśli masz 3 arkusze po 20 leadów = 60 leadów.
System będzie wysyłał **50 pierwszych dziennie**, reszta następnego dnia.

### 4. Monitoring

Regularnie sprawdzaj:
- Dashboard → Lista arkuszy
- Google Sheets → Statusy leadów
- Logi w konsoli → Błędy

---

## 📝 Przyszłe funkcje (TODO)

- [ ] Oddzielne limity na arkusz
- [ ] Harmonogram per arkusz (różne godziny wysyłki)
- [ ] Duplikowanie konfiguracji arkusza
- [ ] Export statystyk per arkusz
- [ ] Webhook po zakończeniu kampanii

---

**Gotowe! Teraz możesz obsługiwać wiele kampanii jednocześnie! 🎉**
