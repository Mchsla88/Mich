import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';

if (!API_KEY) {
  console.warn('UWAGA: GEMINI_API_KEY nie jest ustawiony w pliku .env');
}

const genAI = new GoogleGenerativeAI(API_KEY);

export const performResearch = async (
  company: string,
  website: string,
  email: string,
  promptResearch: string
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const contextInfo = [
      company && `Firma: ${company}`,
      website && `Strona WWW: ${website}`,
      email && `Email: ${email}`
    ].filter(Boolean).join('\n');

    const fullPrompt = `${promptResearch}

Informacje o firmie:
${contextInfo}

Przeprowadź szczegółowy research i zwróć wyniki w formacie strukturalnym obejmującym:
- Profil firmy
- Główne produkty/usługi
- Kluczowe osoby (jeśli dostępne)
- Ostatnie aktualności/wydarzenia
- Potencjalne punkty kontaktu dla współpracy

Zwróć wyniki w języku polskim.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Gemini Research Error:', error);
    throw new Error('Błąd podczas wykonywania researchu przez Gemini API');
  }
};

export const generateEmailSequence = async (
  researchResults: string,
  promptSequence: string,
  recipientName: string,
  recipientEmail: string,
  company: string
): Promise<{ email1: string; email2: string; email3: string }> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const recipientInfo = [
      recipientName && `Odbiorca: ${recipientName}`,
      recipientEmail && `Email odbiorcy: ${recipientEmail}`,
      company && `Firma: ${company}`
    ].filter(Boolean).join('\n');

    const fullPrompt = `${promptSequence}

Informacje o odbiorcy:
${recipientInfo}

Wyniki researchu firmy:
${researchResults}

Na podstawie powyższych informacji wygeneruj sekwencję 3 profesjonalnych emaili:
- Email 1: Pierwszy kontakt - krótki, przedstawiający się
- Email 2: Follow-up - bardziej szczegółowy, pokazujący wartość
- Email 3: Ostatni follow-up - przekonujący do działania (call-to-action)

WAŻNE: Zwróć wyniki w formacie JSON:
{
  "email1": "treść pierwszego emaila",
  "email2": "treść drugiego emaila",
  "email3": "treść trzeciego emaila"
}

Każdy email powinien zawierać:
- Temat emaila (w pierwszej linii jako "Temat: ...")
- Treść emaila
- Profesjonalny podpis

Wszystkie emaile w języku polskim.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Próba parsowania JSON z odpowiedzi
    try {
      // Wyciągnij JSON z odpowiedzi (może być otoczony ```json ... ```)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          email1: parsed.email1 || '',
          email2: parsed.email2 || '',
          email3: parsed.email3 || ''
        };
      }
    } catch (parseError) {
      // Jeśli nie udało się sparsować JSON, podziel tekst manualnie
      console.log('Nie udało się sparsować JSON, próba ręcznego podziału');
    }

    // Fallback: podział tekstu na 3 części
    const sections = text.split(/Email [123]:|---/).filter(s => s.trim());
    return {
      email1: sections[0]?.trim() || 'Błąd generowania Email 1',
      email2: sections[1]?.trim() || 'Błąd generowania Email 2',
      email3: sections[2]?.trim() || 'Błąd generowania Email 3'
    };
  } catch (error) {
    console.error('Gemini Email Generation Error:', error);
    throw new Error('Błąd podczas generowania emaili przez Gemini API');
  }
};
