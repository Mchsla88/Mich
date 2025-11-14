import { EnrichmentResult } from '@/types';
import axios from 'axios';

/**
 * Hunter.io enrichment service
 * Free tier: 25 email verifications/month
 */
export async function enrichWithHunter(
  email: string
): Promise<EnrichmentResult> {
  try {
    const apiKey = getHunterApiKey();
    if (!apiKey) {
      return { success: false, error: 'Hunter API key not configured' };
    }

    const response = await axios.get(
      `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${apiKey}`,
      {
        timeout: 5000,
      }
    );

    const data = response.data.data;

    return {
      success: true,
      source: 'hunter',
      data: {
        emailValid: data.status === 'valid',
        emailScore: data.score,
        firstName: data.first_name,
        lastName: data.last_name,
      },
    };
  } catch (error: any) {
    console.error('Hunter error:', error.message);
    return { success: false, error: error.message };
  }
}

function getHunterApiKey(): string | null {
  if (process.env.HUNTER_API_KEY) {
    return process.env.HUNTER_API_KEY;
  }

  if (typeof window !== 'undefined') {
    const apiKeys = localStorage.getItem('apiKeys');
    if (apiKeys) {
      const parsed = JSON.parse(apiKeys);
      return parsed.hunter || null;
    }
  }

  return null;
}
