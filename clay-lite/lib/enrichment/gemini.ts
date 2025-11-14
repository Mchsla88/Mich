import { GoogleGenerativeAI } from '@google/generative-ai';
import { Lead, EnrichmentResult } from '@/types';

/**
 * Gemini AI enrichment service
 * Uses Google's Gemini API for AI-powered research and insights
 */
export async function enrichWithGeminiAI(
  lead: Lead
): Promise<Partial<Lead>> {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.warn('Gemini API key not configured');
      return {};
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Build context for AI research
    const context = buildLeadContext(lead);

    // Research tasks
    const tasks = [];

    // Task 1: Company research
    if (lead.company || lead.domain) {
      tasks.push(
        researchCompany(model, lead.company || lead.domain!)
      );
    }

    // Task 2: Contact research (if we have name)
    if (lead.firstName && lead.company) {
      tasks.push(
        researchContact(
          model,
          `${lead.firstName} ${lead.lastName || ''}`,
          lead.company
        )
      );
    }

    // Task 3: Industry insights
    if (lead.industry || lead.company) {
      tasks.push(
        getIndustryInsights(model, lead.industry || lead.company!)
      );
    }

    const results = await Promise.allSettled(tasks);

    // Combine results
    let enrichedData: Partial<Lead> = {};

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        enrichedData = { ...enrichedData, ...result.value };
      }
    });

    return enrichedData;
  } catch (error) {
    console.error('Gemini AI enrichment error:', error);
    return {};
  }
}

async function researchCompany(
  model: any,
  companyNameOrDomain: string
): Promise<Partial<Lead>> {
  const prompt = `Research the company "${companyNameOrDomain}". Provide:
1. Company description (2-3 sentences)
2. Industry/sector
3. Approximate company size (employees)
4. Main products or services
5. Target market

Format your response as JSON with keys: companyDescription, industry, companySize, products, targetMarket.
Only provide factual information. If you don't know, return null for that field.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        companyDescription: data.companyDescription,
        industry: data.industry,
        companySize: data.companySize,
      };
    }
  } catch (error) {
    console.error('Company research error:', error);
  }

  return {};
}

async function researchContact(
  model: any,
  contactName: string,
  company: string
): Promise<Partial<Lead>> {
  const prompt = `Research "${contactName}" at company "${company}". Provide:
1. Job title/role
2. LinkedIn profile URL (if publicly available)
3. Professional background summary (1 sentence)
4. Key responsibilities

Format your response as JSON with keys: title, linkedin, background, responsibilities.
Only provide factual, publicly available information. If you don't know, return null.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        title: data.title,
        linkedin: data.linkedin,
        aiResearch: data.background,
      };
    }
  } catch (error) {
    console.error('Contact research error:', error);
  }

  return {};
}

async function getIndustryInsights(
  model: any,
  industryOrCompany: string
): Promise<Partial<Lead>> {
  const prompt = `Provide key insights about the industry of "${industryOrCompany}":
1. Main challenges this industry faces
2. Key decision makers (typical titles)
3. Common pain points
4. Best approach for outreach

Format as JSON with keys: challenges, decisionMakers, painPoints, outreachStrategy.
Keep each field to 1-2 sentences max.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        aiInsights: `Challenges: ${data.challenges}\nPain Points: ${data.painPoints}\nOutreach: ${data.outreachStrategy}`,
      };
    }
  } catch (error) {
    console.error('Industry insights error:', error);
  }

  return {};
}

function buildLeadContext(lead: Lead): string {
  const parts = [];

  if (lead.firstName) parts.push(`Name: ${lead.firstName} ${lead.lastName || ''}`);
  if (lead.email) parts.push(`Email: ${lead.email}`);
  if (lead.company) parts.push(`Company: ${lead.company}`);
  if (lead.title) parts.push(`Title: ${lead.title}`);
  if (lead.industry) parts.push(`Industry: ${lead.industry}`);

  return parts.join('\n');
}

function getGeminiApiKey(): string | null {
  // Try to get from environment first
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  // In browser context, get from localStorage
  if (typeof window !== 'undefined') {
    const apiKeys = localStorage.getItem('apiKeys');
    if (apiKeys) {
      const parsed = JSON.parse(apiKeys);
      return parsed.gemini || null;
    }
  }

  return null;
}
