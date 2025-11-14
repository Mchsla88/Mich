import { NextRequest, NextResponse } from 'next/server';
import { enrichLead } from '@/lib/enrichment/orchestrator';
import { calculateLeadScore } from '@/lib/scoring';

export async function POST(request: NextRequest) {
  try {
    const { leadIds, leads } = await request.json();

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json(
        { error: 'Invalid leads data' },
        { status: 400 }
      );
    }

    const enrichedLeads = await Promise.all(
      leads.map(async (lead) => {
        try {
          // Enrich the lead
          const enriched = await enrichLead(lead);

          // Calculate lead score
          const score = calculateLeadScore(enriched);

          return {
            ...enriched,
            leadScore: score.score,
            leadGrade: score.grade,
            enrichmentStatus: 'completed',
            updatedAt: new Date(),
          };
        } catch (error) {
          console.error(`Error enriching lead ${lead.id}:`, error);
          return {
            ...lead,
            enrichmentStatus: 'failed',
            updatedAt: new Date(),
          };
        }
      })
    );

    return NextResponse.json(enrichedLeads);
  } catch (error) {
    console.error('Enrichment error:', error);
    return NextResponse.json(
      { error: 'Enrichment failed' },
      { status: 500 }
    );
  }
}
