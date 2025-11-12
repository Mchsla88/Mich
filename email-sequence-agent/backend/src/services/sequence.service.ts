import Anthropic from '@anthropic-ai/sdk';
import { EmailSequence, ResearchResult } from '../types.js';
import config from '../config.js';

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
});

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

// Generate email sequence
export async function generateSequence(
  firma: string,
  websiteUrl: string,
  imie: string,
  researchResult: ResearchResult,
  customSignature?: string
): Promise<EmailSequence> {
  const EMAIL_SIGNATURE = customSignature || DEFAULT_EMAIL_SIGNATURE;
  try {
    console.log(`📧 Generating email sequence for ${firma}...`);

    const researchNotes = JSON.stringify(researchResult, null, 2);
    const researchSources = researchResult.sources.join(', ');

    // SEQUENCE PROMPT (z wymagań użytkownika)
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
7. W stopce będzie podpis "Michał Sławiński" (dodany automatycznie - NIE dodawaj go w body_html).

Wzorzec treści (dopasuj do kontekstu audytu WWW):

**Wiadomość 1 (Day 0 – nowy wątek)**
- Temat: spersonalizowany (unikać clickbaitów; nawiązać do ustalenia z audytu).
- Preheader: 120–180 znaków, streszcza problem i korzyść rozmowy.
- Treść (body_html):
  1. Nawiązanie do aktualnej sytuacji odbiorcy oparte na audycie WWW i kontekście branżowym.
  2. Nazwanie kluczowego "ukrytego kosztu"/problemu na stronie z konkretnym "evidence" z audytu.
  3. Konsekwencja w liczbach lub skutkach (utrata konwersji, obniżone SEO, itp.).
  4. Propozycja wartości: szybki przegląd rentowności/konwersji WWW i plan naprawczy w 1–2 tygodnie.
  5. Pytanie zamykające (CTA): czy ten punkt jest dziś palący i czy możemy omówić 15‑min w przyszłym tygodniu?

**Wiadomość 2 (Follow‑up / Day +3 – Re:)**
- Temat: Re: [oryginalny temat]
- Preheader: krótki (max 150 znaków).
- Treść bardzo krótka: uprzejme przypomnienie + odniesienie do 1–2 słów kluczowych z bólu nr 2 (drugi problem z audytu).
- Zero rozbudowanej oferty — tylko prośba o krótką odpowiedź/potwierdzenie terminu.

**Wiadomość 3 (Follow‑up 2 / Breakup / Day +7 – Re:)**
- Temat: Re: [oryginalny temat]
- Preheader: "Zamykam wątek — jeśli temat wróci…"
- Treść: uprzejme zamknięcie, uznanie priorytetów odbiorcy; wskazanie, że wrócimy, jeśli temat konwersji/SEO/UX stanie się aktualny.

Format wyjścia JSON (obowiązkowo):
{
  "steps": [
    {"subject": "...", "preheader": "...", "body_html": "...", "send_after_days": 0},
    {"subject": "Re: ...", "preheader": "...", "body_html": "...", "send_after_days": 3},
    {"subject": "Re: ...", "preheader": "...", "body_html": "...", "send_after_days": 7}
  ]
}

Dodatkowe wymogi jakości:
1. W body_html wklejaj konkretne odniesienia do sekcji/URL z audytu – bez linków zewnętrznych.
2. Nie wspominaj o "AI" ani narzędziach — mów o "audyt"/"przegląd".
3. Jeśli brakuje danych (np. brak bloga), nie wymyślaj — zaproponuj adekwatny quick win.
4. Zachowaj poprawne kodowanie polskich znaków i poprawną polszczyznę.
5. Długości: Mail 1: 120–200 słów; Mail 2: ≤50 słów; Mail 3: ≤60 słów.
6. Użyj HTML <p> tagów dla akapitów, <strong> dla wyróżnień, <br> dla przejść linii gdzie potrzeba.
7. NIE dodawaj podpisu/stopki - zostanie dodany automatycznie.

WAŻNE: Zwróć TYLKO JSON, bez dodatkowych komentarzy przed ani po.
`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: config.aiModel,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: sequencePrompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    console.log('🤖 Claude sequence response:', responseText.substring(0, 200) + '...');

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Claude response');
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

    console.log(`✅ Email sequence generated for ${firma}`);

    return sequence;
  } catch (error: any) {
    console.error(`❌ Error generating sequence for ${firma}:`, error);

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
  generateSequence,
};
