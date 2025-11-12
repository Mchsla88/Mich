import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { Workflow } from './types.js';
import { WorkflowExecutor } from './executor.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (in production, use a database)
const workflows: Map<string, Workflow> = new Map();

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all workflows
app.get('/api/workflows', (req: Request, res: Response) => {
  const workflowList = Array.from(workflows.values());
  res.json(workflowList);
});

// Get specific workflow
app.get('/api/workflows/:id', (req: Request, res: Response) => {
  const workflow = workflows.get(req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  res.json(workflow);
});

// Create workflow
app.post('/api/workflows', (req: Request, res: Response) => {
  const { name, nodes, edges } = req.body;

  const workflow: Workflow = {
    id: uuidv4(),
    name: name || 'Untitled Workflow',
    nodes: nodes || [],
    edges: edges || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  workflows.set(workflow.id, workflow);
  res.status(201).json(workflow);
});

// Update workflow
app.put('/api/workflows/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const workflow = workflows.get(id);

  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  const updated: Workflow = {
    ...workflow,
    ...req.body,
    id, // Keep original ID
    updatedAt: new Date().toISOString()
  };

  workflows.set(id, updated);
  res.json(updated);
});

// Delete workflow
app.delete('/api/workflows/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  if (!workflows.has(id)) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  workflows.delete(id);
  res.status(204).send();
});

// Execute workflow
app.post('/api/workflows/:id/execute', async (req: Request, res: Response) => {
  const { id } = req.params;
  const workflow = workflows.get(id);

  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  const input = req.body.input || {};

  try {
    const executor = new WorkflowExecutor(workflow.nodes, workflow.edges);
    const result = await executor.execute(input);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Agent Builder Backend running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET    /api/health`);
  console.log(`   GET    /api/workflows`);
  console.log(`   POST   /api/workflows`);
  console.log(`   GET    /api/workflows/:id`);
  console.log(`   PUT    /api/workflows/:id`);
  console.log(`   DELETE /api/workflows/:id`);
  console.log(`   POST   /api/workflows/:id/execute`);
});

export default app;
