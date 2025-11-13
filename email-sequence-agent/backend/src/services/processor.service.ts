// ⚠️  LEGACY CODE - NOT USED IN PRODUCTION
// This file is for the old service account architecture.
// Use processor-multi.service.ts instead for OAuth-based multi-campaign support.

import { Lead, ResearchResult, EmailSequence } from '../types.js';

// Process leads that need research
export async function processResearch(): Promise<number> {
  throw new Error('⚠️  This function is deprecated. Use processor-multi.service.ts instead.');
}

// Process leads that need sequence generation
export async function processSequenceGeneration(): Promise<number> {
  throw new Error('⚠️  This function is deprecated. Use processor-multi.service.ts instead.');
}

// Process sending emails
export async function processSending(): Promise<number> {
  throw new Error('⚠️  This function is deprecated. Use processor-multi.service.ts instead.');
}

// Check for replies
export async function checkReplies(): Promise<number> {
  throw new Error('⚠️  This function is deprecated. Use processor-multi.service.ts instead.');
}

// Process all steps
export async function processAll(): Promise<void> {
  throw new Error('⚠️  This function is deprecated. Use processor-multi.service.ts instead.');
}
