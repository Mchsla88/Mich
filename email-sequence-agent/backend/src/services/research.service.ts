import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ResearchResult } from '../types.js';
import config from '../config.js';

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
});

// Fetch website content
async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    // Ensure URL has protocol
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    const response = await axios.get(fullUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);

    // Remove scripts, styles, and other non-content elements
    $('script, style, noscript, iframe, svg').remove();

    // Extract key sections
    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const h1 = $('h1').map((_, el) => $(el).text().trim()).get().join(' | ');
    const h2 = $('h2').map((_, el) => $(el).text().trim()).get().slice(0, 10).join(' | ');

    // Get main content (first 5000 chars)
    const bodyText = $('body').text()
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000);

    // Get navigation
    const nav = $('nav, header').text()
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500);

    // Check for common elements
    const hasBlog = $('a[href*="blog"], a[href*="aktualnosci"], a[href*="news"]').length > 0;
    const hasContactForm = $('form[action*="contact"], form[class*="contact"], input[type="email"]').length > 0;
    const hasChat = $('.chat, #chat, [class*="chat-widget"]').length > 0;

    const content = `
=== STRONA: ${fullUrl} ===

TYTUŁ: ${title}
META DESCRIPTION: ${metaDescription}

NAGŁÓWKI H1: ${h1}
NAGŁÓWKI H2: ${h2}

NAWIGACJA: ${nav}

TREŚĆ GŁÓWNA:
${bodyText}

ELEMENTY:
- Blog/Aktualności: ${hasBlog ? 'TAK' : 'NIE'}
- Formularz kontaktowy: ${hasContactForm ? 'TAK' : 'NIE'}
- Chat: ${hasChat ? 'TAK' : 'NIE'}
`;

    return content;
  } catch (error: any) {
    console.error(`❌ Error fetching website ${url}:`, error.message);
    return `[ERROR: Nie udało się pobrać strony ${url}. Błąd: ${error.message}]`;
  }
}

// Fetch additional pages (blog, about, etc.)
async function fetchAdditionalPages(baseUrl: string): Promise<string[]> {
  const contents: string[] = [];
  const commonPages = ['/o-nas', '/about', '/blog', '/oferta', '/services', '/produkty'];

  for (const page of commonPages.slice(0, 3)) { // Limit to 3 additional pages
    try {
      const fullUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
      const pageUrl = new URL(page, fullUrl).toString();

      const content = await fetchWebsiteContent(pageUrl);
      if (!content.includes('[ERROR:')) {
        contents.push(content);
      }
    } catch (error) {
      // Ignore errors for additional pages
    }
  }

  return contents;
}

// Perform website research/audit
export async function performResearch(
  firma: string,
  websiteUrl: string,
  imie?: string
): Promise<ResearchResult> {
  try {
    console.log(`🔍 Starting research for ${firma} (${websiteUrl})...`);

    // Fetch main page content
    const mainContent = await fetchWebsiteContent(websiteUrl);

    // Fetch some additional pages
    const additionalContents = await fetchAdditionalPages(websiteUrl);

    // Combine all content
    const allContent = [mainContent, ...additionalContents].join('\n\n---\n\n');

    // RESEARCH PROMPT (z wymagań użytkownika)
    const researchPrompt = `
Cel: przygotować rzetelny, aktualny (≤90 dni) mini‑audyt strony WWW klienta, wskazujący słabe punkty, które posłużą jako podstawa do personalizowanego cold maila (moja firma: tworzenie stron internetowych).

Wejście (dane):
Firma: ${firma}
URL: ${websiteUrl}
${imie ? `Osoba: ${imie}` : ''}

Instrukcja:
Przejdź po kluczowych elementach strony i oceń krytycznie, ale rzeczowo:
1. Wydajność i Core Web Vitals (LCP, CLS) – ogólna ocena szybkości ładowania; wskaż, które sekcje spowalniają (hero, duże obrazy, skrypty).
2. SEO on‑page: tagi title/meta, nagłówki H1/H2, internal linking, atrybuty alt, indeksowalność kluczowych podstron.
3. Treść i Value Proposition: czy zrozumiała w 5 sekund? CTA widoczne? Język korzyści vs. żargon.
4. UX/UI: nawigacja, czytelność, kontrasty, dostępność (ARIA, alt), mobile‑first (przyciski, menu, breakpoints).
5. Technologia i stan techniczny: CMS/framework, ślady przestarzałych wtyczek, błędy konsoli, HTTP vs. HTTPS, mixed content.
6. Konwersja: formularze (liczba pól, walidacja), chat, mechanizmy zaufania (logotypy, case studies, referencje).
7. Aktualność: blog/aktualności (ostatnie wpisy ≤90 dni?), treści zdezaktualizowane.

Nie wymyślaj danych. Jeśli czegoś nie możesz ocenić bez narzędzi, oznacz jako "do weryfikacji".
Podaj konkretne przykłady z tej strony (np. tytuł sekcji, ścieżka/URL, fragment tekstu), unikaj ogólników.
Na końcu dodaj 3–5 krótkich rekomendacji "co poprawić w 1–2 tygodnie" (quick wins).

Język: polski.

Format JSON (ściśle):
{
  "summary": "2–3 zdania ogólnej oceny",
  "issues": [
    {"area": "Performance", "finding": "konkretny problem", "evidence": "gdzie/widoczne na stronie", "impact": "krótko o wpływie", "confidence": "wysokie|średnie|niskie"},
    {"area": "SEO", "finding": "...", "evidence": "...", "impact": "...", "confidence": "..."}
  ],
  "quick_wins": [
    "Rekomendacja 1 (konkret: co i gdzie)",
    "Rekomendacja 2",
    "Rekomendacja 3"
  ],
  "sources": ["${websiteUrl}", "konkretne podstrony"]
}

Ograniczenia długości:
- summary: max 300 znaków
- issues: 5–8 pozycji, każda finding ≤ 180 znaków, evidence ≤ 120 znaków
- quick_wins: 3–5 punktów, każdy ≤ 120 znaków
- sources: tylko własne podstrony + ewentualnie 1–2 oficjalne źródła firmy

Zasady jakości:
- Zero ogólników; każdy problem poprzyj "evidence"
- Nie używaj narzędzi zewnętrznych wprost (strzel estymacją i oznacz "do weryfikacji" gdzie trzeba)
- Unikaj błędów faktograficznych; jeśli brak danych, napisz to wprost

TREŚĆ STRONY DO ANALIZY:
${allContent}
`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: config.aiModel,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: researchPrompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    console.log('🤖 Claude response:', responseText.substring(0, 200) + '...');

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Claude response');
    }

    const result: ResearchResult = JSON.parse(jsonMatch[0]);

    console.log(`✅ Research completed for ${firma}`);

    return result;
  } catch (error: any) {
    console.error(`❌ Error performing research for ${firma}:`, error);

    // Return error result
    return {
      summary: `Nie udało się przeprowadzić pełnego audytu strony ${websiteUrl}. Błąd: ${error.message}`,
      issues: [
        {
          area: 'System',
          finding: 'Błąd podczas audytu',
          evidence: error.message,
          impact: 'Brak pełnych danych',
          confidence: 'niskie',
        },
      ],
      quick_wins: [
        'Spróbuj ponownie później',
        'Sprawdź dostępność strony',
      ],
      sources: [websiteUrl],
    };
  }
}

export default {
  performResearch,
};
