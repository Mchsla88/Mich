import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { performResearch, generateEmailSequence } from './gemini.js';
import {
  ResearchRequest,
  EmailGenerationRequest,
  ResearchResponse,
  EmailGenerationResponse
} from './types.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Excel CRM Backend is running' });
});

// Research endpoint
app.post('/api/research', async (req: Request, res: Response) => {
  try {
    const { rowId, company, website, email, promptResearch }: ResearchRequest = req.body;

    if (!promptResearch) {
      return res.status(400).json({
        rowId,
        success: false,
        error: 'Prompt Research jest wymagany'
      } as ResearchResponse);
    }

    if (!company && !website && !email) {
      return res.status(400).json({
        rowId,
        success: false,
        error: 'Musisz podać co najmniej: Firmę, Stronę WWW lub Email'
      } as ResearchResponse);
    }

    console.log(`🔍 Rozpoczynam research dla wiersza ${rowId}...`);

    const researchResults = await performResearch(company, website, email, promptResearch);

    console.log(`✅ Research zakończony dla wiersza ${rowId}`);

    res.json({
      rowId,
      researchResults,
      success: true
    } as ResearchResponse);
  } catch (error) {
    console.error('Research error:', error);
    const { rowId } = req.body;
    res.status(500).json({
      rowId,
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany błąd'
    } as ResearchResponse);
  }
});

// Email generation endpoint
app.post('/api/generate-emails', async (req: Request, res: Response) => {
  try {
    const {
      rowId,
      researchResults,
      promptSequence,
      recipientName,
      recipientEmail,
      company
    }: EmailGenerationRequest = req.body;

    if (!researchResults) {
      return res.status(400).json({
        rowId,
        success: false,
        error: 'Brak wyników researchu'
      } as EmailGenerationResponse);
    }

    if (!promptSequence) {
      return res.status(400).json({
        rowId,
        success: false,
        error: 'Prompt Sekwencja jest wymagany'
      } as EmailGenerationResponse);
    }

    console.log(`📧 Rozpoczynam generowanie emaili dla wiersza ${rowId}...`);

    const emails = await generateEmailSequence(
      researchResults,
      promptSequence,
      recipientName,
      recipientEmail,
      company
    );

    console.log(`✅ Emaile wygenerowane dla wiersza ${rowId}`);

    res.json({
      rowId,
      ...emails,
      success: true
    } as EmailGenerationResponse);
  } catch (error) {
    console.error('Email generation error:', error);
    const { rowId } = req.body;
    res.status(500).json({
      rowId,
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany błąd',
      email1: '',
      email2: '',
      email3: ''
    } as EmailGenerationResponse);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Excel CRM Backend uruchomiony na porcie ${PORT}`);
  console.log(`📝 API endpoints:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - POST /api/research`);
  console.log(`   - POST /api/generate-emails`);
});
