import { Lead } from '@/types';

interface LeadScoreResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    emailScore: number;
    companyScore: number;
    titleScore: number;
    dataCompletenessScore: number;
  };
}

/**
 * Calculate lead score based on various factors
 * Score range: 0-100
 */
export function calculateLeadScore(lead: Lead): LeadScoreResult {
  let score = 0;
  const breakdown = {
    emailScore: 0,
    companyScore: 0,
    titleScore: 0,
    dataCompletenessScore: 0,
  };

  // 1. Email quality (25 points)
  if (lead.email) {
    if (lead.emailValid) {
      breakdown.emailScore = 25;
    } else {
      breakdown.emailScore = 10;
    }

    // Bonus for email score from Hunter
    if (lead.emailScore && lead.emailScore > 70) {
      breakdown.emailScore = Math.min(25, breakdown.emailScore + 5);
    }
  }

  // 2. Company quality (30 points)
  if (lead.company) {
    breakdown.companyScore = 10;

    // Company size matters
    if (lead.companySize) {
      const size = parseInt(lead.companySize);
      if (size > 1000) breakdown.companyScore += 10; // Enterprise
      else if (size > 100) breakdown.companyScore += 7; // Mid-market
      else if (size > 10) breakdown.companyScore += 5; // SMB
    }

    // Industry match (customize this based on your ICP)
    if (lead.industry) {
      breakdown.companyScore += 5;
    }

    // Has enriched data
    if (lead.companyDescription) {
      breakdown.companyScore += 5;
    }
  }

  // 3. Title/Seniority (25 points)
  if (lead.title) {
    const title = lead.title.toLowerCase();

    // C-level
    if (
      title.includes('ceo') ||
      title.includes('cto') ||
      title.includes('cfo') ||
      title.includes('coo') ||
      title.includes('chief')
    ) {
      breakdown.titleScore = 25;
    }
    // VP/Director level
    else if (
      title.includes('vp') ||
      title.includes('vice president') ||
      title.includes('director') ||
      title.includes('head of')
    ) {
      breakdown.titleScore = 20;
    }
    // Manager level
    else if (title.includes('manager') || title.includes('lead')) {
      breakdown.titleScore = 15;
    }
    // Individual contributor
    else {
      breakdown.titleScore = 10;
    }
  }

  // 4. Data completeness (20 points)
  const fields = [
    lead.firstName,
    lead.lastName,
    lead.email,
    lead.company,
    lead.title,
    lead.phone,
    lead.linkedin,
    lead.industry,
    lead.companyDescription,
    lead.companySize,
  ];

  const filledFields = fields.filter((f) => f && f !== '').length;
  breakdown.dataCompletenessScore = Math.round((filledFields / fields.length) * 20);

  // Calculate total score
  score =
    breakdown.emailScore +
    breakdown.companyScore +
    breakdown.titleScore +
    breakdown.dataCompletenessScore;

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return {
    score,
    grade,
    breakdown,
  };
}

/**
 * Filter leads by minimum score
 */
export function filterLeadsByScore(
  leads: Lead[],
  minScore: number
): Lead[] {
  return leads.filter((lead) => {
    const score = calculateLeadScore(lead);
    return score.score >= minScore;
  });
}

/**
 * Sort leads by score (descending)
 */
export function sortLeadsByScore(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => {
    const scoreA = calculateLeadScore(a).score;
    const scoreB = calculateLeadScore(b).score;
    return scoreB - scoreA;
  });
}
