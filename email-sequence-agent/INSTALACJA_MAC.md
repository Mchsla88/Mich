# Instalacja na Mac - Email Sequence Agent

## Krok 1: Zainstaluj Homebrew (menedżer pakietów dla Mac)

Otwórz Terminal (⌘ + Spacja, wpisz "Terminal") i wklej:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Postępuj zgodnie z instrukcjami na ekranie.

## Krok 2: Zainstaluj Node.js i Git

W Terminalu wpisz:

```bash
brew install node git
```

Sprawdź instalację:

```bash
node --version    # Powinno pokazać wersję (np. v20.x.x)
npm --version     # Powinno pokazać wersję (np. 10.x.x)
git --version     # Powinno pokazać wersję
```

## Krok 3: Sklonuj repozytorium

```bash
cd ~/Desktop                    # Przejdź na pulpit (lub inną lokalizację)
git clone https://github.com/Mchsla88/Mich.git
cd Mich/email-sequence-agent/backend
```

## Krok 4: Zainstaluj zależności

```bash
npm install
```

## Krok 5: Skopiuj plik konfiguracyjny

```bash
cp .env.example .env
```

## Krok 6: Utwórz folder na credentials

```bash
mkdir credentials
```

## Krok 7: Uruchom serwer

```bash
npm run dev
```

Zobaczysz komunikat:

```
🌐 Server running on http://localhost:3002
📊 Dashboard: http://localhost:3002
```

## Krok 8: Otwórz Dashboard

Otwórz przeglądarkę i wejdź na:

```
http://localhost:3002
```

---

## ⚠️ Uwaga o błędach Google Auth

Po uruchomieniu zobaczysz błędy:
```
❌ Failed to initialize Google Auth
```

**To jest normalne!** Te błędy znikną dopiero gdy:
1. Skonfigurujesz Google Service Account (według instrukcji z `INSTRUKCJA_URUCHOMIENIA.md`)
2. Umieścisz plik `google-credentials.json` w folderze `credentials/`

Do tego czasu możesz normalnie korzystać z dashboardu i konfigurować API keys.

---

## Szybki start (jeśli masz już wszystko zainstalowane)

```bash
cd ~/Desktop/Mich/email-sequence-agent/backend
npm run dev
```

Otwórz: http://localhost:3002

---

## Zatrzymanie serwera

W Terminalu naciśnij: **Ctrl + C**

---

## Pomoc

Jeśli masz problemy:
1. Sprawdź czy Node.js jest zainstalowany: `node --version`
2. Sprawdź czy jesteś w odpowiednim folderze: `pwd` (powinno pokazać `.../email-sequence-agent/backend`)
3. Zobacz szczegółową instrukcję w pliku `INSTRUKCJA_URUCHOMIENIA.md`
