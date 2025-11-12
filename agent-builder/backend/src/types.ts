export type NodeType =
  | 'start'
  | 'ai-agent'
  | 'api-call'
  | 'conditional'
  | 'transform'
  | 'output';

export interface NodeData {
  label: string;
  type: NodeType;
  config?: {
    prompt?: string;
    model?: string;
    apiUrl?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    condition?: string;
    transformCode?: string;
    [key: string]: any;
  };
}

export interface FlowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionContext {
  variables: Record<string, any>;
  history: Array<{
    nodeId: string;
    input: any;
    output: any;
    timestamp: string;
  }>;
}

export interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  context: ExecutionContext;
}
