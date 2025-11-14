import { EnrichmentResult } from '@/types';
import axios from 'axios';

/**
 * Clearbit enrichment service
 * Free tier: 500 company lookups/month
 */
export async function enrichWithClearbit(
  domain: string
): Promise<EnrichmentResult> {
  try {
    const apiKey = getClearbitApiKey();
    if (!apiKey) {
      return { success: false, error: 'Clearbit API key not configured' };
    }

    const response = await axios.get(
      `https://company.clearbit.com/v2/companies/find?domain=${domain}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 5000,
      }
    );

    const data = response.data;

    return {
      success: true,
      source: 'clearbit',
      data: {
        company: data.name,
        domain: data.domain,
        companyDescription: data.description,
        companyLogo: data.logo,
        industry: data.category?.industry,
        companySize: `${data.metrics?.employees || 'Unknown'}`,
        companyLocation: `${data.geo?.city || ''}, ${data.geo?.country || ''}`.trim(),
        companyWebsite: data.url,
        techStack: data.tech || [],
      },
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      return { success: false, error: 'Company not found' };
    }
    console.error('Clearbit error:', error.message);
    return { success: false, error: error.message };
  }
}

function getClearbitApiKey(): string | null {
  if (process.env.CLEARBIT_API_KEY) {
    return process.env.CLEARBIT_API_KEY;
  }

  if (typeof window !== 'undefined') {
    const apiKeys = localStorage.getItem('apiKeys');
    if (apiKeys) {
      const parsed = JSON.parse(apiKeys);
      return parsed.clearbit || null;
    }
  }

  return null;
}
