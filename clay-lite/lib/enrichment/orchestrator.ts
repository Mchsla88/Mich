import { Lead, EnrichmentResult } from '@/types';
import { enrichWithClearbit } from './clearbit';
import { enrichWithHunter } from './hunter';
import { enrichWithGeminiAI } from './gemini';
import { enrichWithWebScraping } from './web-scraping';
import { validateEmail, extractDomain } from '@/lib/utils';

/**
 * Main orchestrator for lead enrichment
 * Implements waterfall logic: try sources in order until data is found
 */
export async function enrichLead(lead: Lead): Promise<Lead> {
  let enrichedLead = { ...lead };

  // 1. Email validation (instant, free)
  if (lead.email) {
    enrichedLead.emailValid = validateEmail(lead.email);
    enrichedLead.domain = extractDomain(lead.email) || lead.domain;
  }

  // 2. Company enrichment waterfall
  if (enrichedLead.domain || enrichedLead.company) {
    const companyData = await enrichCompany(
      enrichedLead.domain || enrichedLead.company!
    );
    enrichedLead = { ...enrichedLead, ...companyData };
  }

  // 3. Email enrichment (if we have email)
  if (enrichedLead.email) {
    const emailData = await enrichEmail(enrichedLead.email);
    enrichedLead = { ...enrichedLead, ...emailData };
  }

  // 4. Contact enrichment (if we have name + company)
  if (enrichedLead.firstName && enrichedLead.company) {
    const contactData = await enrichContact(
      enrichedLead.firstName,
      enrichedLead.lastName,
      enrichedLead.company
    );
    enrichedLead = { ...enrichedLead, ...contactData };
  }

  // 5. AI Research (Gemini) - get insights and additional data
  const aiResearch = await enrichWithGeminiAI(enrichedLead);
  enrichedLead = { ...enrichedLead, ...aiResearch };

  enrichedLead.lastEnriched = new Date();
  enrichedLead.updatedAt = new Date();

  return enrichedLead;
}

async function enrichCompany(
  domainOrName: string
): Promise<Partial<Lead>> {
  // Waterfall: Clearbit → Web Scraping → Gemini AI
  let result: Partial<Lead> = {};

  // Try Clearbit first (500/month free)
  const clearbitData = await enrichWithClearbit(domainOrName);
  if (clearbitData.success && clearbitData.data) {
    result = { ...result, ...clearbitData.data, enrichmentSource: 'clearbit' };
  }

  // If Clearbit failed, try web scraping
  if (!result.companyDescription) {
    const scrapedData = await enrichWithWebScraping(domainOrName);
    if (scrapedData.success && scrapedData.data) {
      result = {
        ...result,
        ...scrapedData.data,
        enrichmentSource: 'web-scraping',
      };
    }
  }

  return result;
}

async function enrichEmail(email: string): Promise<Partial<Lead>> {
  // Use Hunter.io for email verification (25/month free)
  const hunterData = await enrichWithHunter(email);
  if (hunterData.success && hunterData.data) {
    return { ...hunterData.data, enrichmentSource: 'hunter' };
  }

  return {};
}

async function enrichContact(
  firstName: string,
  lastName: string = '',
  company: string
): Promise<Partial<Lead>> {
  // Use Gemini AI to find LinkedIn, title, etc.
  const searchQuery = `${firstName} ${lastName} ${company}`;
  // This would use Google Custom Search or web scraping
  // For now, we'll rely on Gemini AI research

  return {};
}
