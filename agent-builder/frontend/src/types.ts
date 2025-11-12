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

export interface Workflow {
  id?: string;
  name: string;
  nodes: any[];
  edges: any[];
  createdAt?: string;
  updatedAt?: string;
}
