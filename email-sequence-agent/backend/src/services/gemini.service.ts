import { GoogleGenerativeAI } from '@google/generative-ai';
import { EmailSequence, ResearchResult } from '../types.js';

// Default email signature (HTML) - used when no custom signature is provided
const DEFAULT_EMAIL_SIGNATURE = `
<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-family: Arial, sans-serif; font-size: 14px; color: #333;">
  <p style="margin: 0 0 10px 0;"><strong>Michał Sławiński</strong></p>
  <p style="margin: 0 0 5px 0;">Tworzenie Stron Internetowych</p>
  <p style="margin: 0 0 5px 0;">Email: <a href="mailto:michal@mayiawebsite.pl" style="color: #0066cc;">michal@mayiawebsite.pl</a></p>
  <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
    Jeśli nie jesteś zainteresowany/a, daj znać - nie będę więcej pisać.
  </p>
</div>
`;

// Perform website research using Gemini API
export async function performResearch(
  websiteUrl: string,
  apiKey: string
): Promise<ResearchResult> {
  try {
    console.log(`🔍 [Gemini] Researching website: ${websiteUrl}`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Research prompt (similar to Anthropic version)
    const researchPrompt = `
Cel: Wykonać audyt strony WWW dla firmy oferującej tworzenie stron internetowych.

URL: ${websiteUrl}

Przeprowadź szczegółową analizę strony pod kątem:
1. Performance (szybkość ładowania, optymalizacja)
2. SEO (meta tagi, struktura, widoczność w Google)
3. UX/UI (użyteczność, design, nawigacja)
4. Conversion (CTA, formularze, ścieżka konwersji)

Format odpowiedzi - zwróć TYLKO JSON w tym formacie:
{
  "summary": "Krótkie podsumowanie 2-3 zdania",
  "issues": [
    {
      "area": "Performance|SEO|UX|Conversion",
      "finding": "Opis problemu",
      "evidence": "Konkretne dowody",
      "impact": "Wpływ na biznes",
      "confidence": "wysokie|średnie|niskie"
    }
  ],
  "quick_wins": ["Lista szybkich poprawek"],
  "sources": ["Lista przeanalizowanych sekcji/stron"]
}

WAŻNE: Zwróć TYLKO JSON, bez dodatkowego tekstu.
`;

    const result = await model.generateContent(researchPrompt);
    const response = await result.response;
    const responseText = response.text();

    console.log('🤖 [Gemini] Research response received');

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Gemini response');
    }

    const researchResult: ResearchResult = JSON.parse(jsonMatch[0]);

    console.log(`✅ [Gemini] Research completed for ${websiteUrl}`);

    return researchResult;
  } catch (error: any) {
    console.error(`❌ [Gemini] Research error for ${websiteUrl}:`, error);

    // Return fallback result
    return {
      summary: 'Nie udało się przeprowadzić pełnej analizy strony.',
      issues: [
        {
          area: 'Performance',
          finding: 'Wymaga analizy technicznej',
          evidence: 'Automatyczna analiza niedostępna',
          impact: 'Potencjalny wpływ na konwersję',
          confidence: 'niskie',
        },
      ],
      quick_wins: ['Skontaktuj się w celu szczegółowego audytu'],
      sources: [websiteUrl],
    };
  }
}

// Generate email sequence using Gemini API
export async function generateSequence(
  firma: string,
  websiteUrl: string,
  imie: string,
  researchResult: ResearchResult,
  apiKey: string,
  customSignature?: string
): Promise<EmailSequence> {
  const EMAIL_SIGNATURE = customSignature || DEFAULT_EMAIL_SIGNATURE;

  try {
    console.log(`📧 [Gemini] Generating email sequence for ${firma}...`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const researchNotes = JSON.stringify(researchResult, null, 2);
    const researchSources = researchResult.sources.join(', ');

    // SEQUENCE PROMPT (identical to Anthropic version)
    const sequencePrompt = `
Cel: Wygenerować 3‑krokową sekwencję cold mail w języku polskim dla firmy oferującej tworzenie stron WWW. Mail 1 oparty o aktualny audyt strony (≤90 dni). Mail 2 to krótkie przypomnienie. Mail 3 to uprzejmy breakup.

Kontekst wejściowy:
Imię: ${imie}
Firma: ${firma}
Website: ${websiteUrl}
Notatki z audytu WWW: ${researchNotes}
Źródła: ${researchSources}

Zasady ogólne:
1. Styl: formalny, rzeczowy, uprzejmy. 120–200 słów na Mail 1; Mail 2 bardzo krótki; Mail 3 zwięzły.
2. Każdy krok ma: subject, preheader (120–180 znaków), body_html (HTML, akapity <p>...</p>, polskie znaki).
3. Mail 1 zaczyna się od konkretnego nawiązania do najważniejszego ustalenia z audytu (unikaj ogólników).
4. Nie używaj emoji, nie przesadzaj z marketingową nowomową.
5. Follow‑upy (Mail 2 i 3) idą w tym samym wątku (temat z prefiksem "Re:").
6. CTA: krótka propozycja rozmowy 15 min (Mail 1) i prośba o krótką odpowiedź (Mail 2).
7. W stopce będzie podpis (dodany automatycznie - NIE dodawaj go w body_html).

Format wyjścia JSON (obowiązkowo):
{
  "steps": [
    {"subject": "...", "preheader": "...", "body_html": "...", "send_after_days": 0},
    {"subject": "Re: ...", "preheader": "...", "body_html": "...", "send_after_days": 3},
    {"subject": "Re: ...", "preheader": "...", "body_html": "...", "send_after_days": 7}
  ]
}

WAŻNE: Zwróć TYLKO JSON, bez dodatkowych komentarzy przed ani po.
`;

    const result = await model.generateContent(sequencePrompt);
    const response = await result.response;
    const responseText = response.text();

    console.log('🤖 [Gemini] Sequence response received');

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Gemini response');
    }

    const sequence: EmailSequence = JSON.parse(jsonMatch[0]);

    // Add signature to each email body
    sequence.steps = sequence.steps.map(step => ({
      ...step,
      body_html: step.body_html + EMAIL_SIGNATURE,
    }));

    // Validate sequence
    if (!sequence.steps || sequence.steps.length !== 3) {
      throw new Error('Invalid sequence: must have exactly 3 steps');
    }

    console.log(`✅ [Gemini] Email sequence generated for ${firma}`);

    return sequence;
  } catch (error: any) {
    console.error(`❌ [Gemini] Error generating sequence for ${firma}:`, error);

    // Return fallback sequence
    return {
      steps: [
        {
          subject: `${firma} - możliwości poprawy strony WWW`,
          preheader: 'Szybki przegląd Twojej witryny pokazał kilka kluczowych punktów do poprawy.',
          body_html: `
<p>Dzień dobry ${imie},</p>

<p>Przeanalizowałem stronę ${websiteUrl} i zauważyłem kilka obszarów, które mogą ograniczać konwersje i widoczność w Google.</p>

<p>Czy byłby Pan/Pani zainteresowany/a 15-minutową rozmową, żeby omówić konkretne rekomendacje?</p>

<p>Pozdrawiam,</p>
` + EMAIL_SIGNATURE,
          send_after_days: 0,
        },
        {
          subject: `Re: ${firma} - możliwości poprawy strony WWW`,
          preheader: 'Krótkie przypomnienie w sprawie audytu strony',
          body_html: `
<p>Dzień dobry ${imie},</p>

<p>Czy miał/a Pan/Pani czas spojrzeć na moją poprzednią wiadomość?</p>

<p>Pozdrawiam,</p>
` + EMAIL_SIGNATURE,
          send_after_days: 3,
        },
        {
          subject: `Re: ${firma} - możliwości poprawy strony WWW`,
          preheader: 'Zamykam wątek - daj znać, jeśli temat stanie się aktualny',
          body_html: `
<p>Dzień dobry ${imie},</p>

<p>Rozumiem, że teraz może nie być najlepszy moment. Jeśli temat optymalizacji strony stanie się aktualny, proszę o kontakt.</p>

<p>Pozdrawiam,</p>
` + EMAIL_SIGNATURE,
          send_after_days: 7,
        },
      ],
    };
  }
}

export default {
  performResearch,
  generateSequence,
};
