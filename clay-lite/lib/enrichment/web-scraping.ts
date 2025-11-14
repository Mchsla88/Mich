import { EnrichmentResult } from '@/types';

/**
 * Web scraping enrichment service
 * Scrapes company websites for basic information
 * Free and unlimited, but rate-limited by politeness
 */
export async function enrichWithWebScraping(
  domain: string
): Promise<EnrichmentResult> {
  try {
    // Ensure domain has protocol
    const url = domain.startsWith('http') ? domain : `https://${domain}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; ClayLite/1.0; +https://claylite.com)',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to fetch website' };
    }

    const html = await response.text();

    // Extract metadata from HTML
    const data: any = {};

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      data.company = titleMatch[1].split('|')[0].trim();
    }

    // Extract meta description
    const descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    );
    if (descMatch) {
      data.companyDescription = descMatch[1];
    }

    // Extract Open Graph image (logo)
    const ogImageMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
    );
    if (ogImageMatch) {
      data.companyLogo = ogImageMatch[1];
    }

    // Try to detect technology stack from scripts
    const techStack: string[] = [];
    if (html.includes('react')) techStack.push('React');
    if (html.includes('vue')) techStack.push('Vue.js');
    if (html.includes('angular')) techStack.push('Angular');
    if (html.includes('jquery')) techStack.push('jQuery');
    if (html.includes('gtag') || html.includes('analytics')) {
      techStack.push('Google Analytics');
    }

    if (techStack.length > 0) {
      data.techStack = techStack;
    }

    return {
      success: true,
      source: 'web-scraping',
      data,
    };
  } catch (error: any) {
    console.error('Web scraping error:', error.message);
    return { success: false, error: error.message };
  }
}
