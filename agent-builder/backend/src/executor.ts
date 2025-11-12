import { FlowNode, FlowEdge, ExecutionContext, ExecutionResult, NodeData } from './types.js';

export class WorkflowExecutor {
  private nodes: Map<string, FlowNode>;
  private edges: FlowEdge[];
  private context: ExecutionContext;

  constructor(nodes: FlowNode[], edges: FlowEdge[]) {
    this.nodes = new Map(nodes.map(node => [node.id, node]));
    this.edges = edges;
    this.context = {
      variables: {},
      history: []
    };
  }

  async execute(input: any = {}): Promise<ExecutionResult> {
    try {
      this.context.variables = { ...input };

      // Find start node
      const startNode = Array.from(this.nodes.values()).find(
        node => node.type === 'start'
      );

      if (!startNode) {
        throw new Error('No start node found in workflow');
      }

      const result = await this.executeNode(startNode.id, input);

      return {
        success: true,
        output: result,
        context: this.context
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        context: this.context
      };
    }
  }

  private async executeNode(nodeId: string, input: any): Promise<any> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    console.log(`Executing node: ${node.data.label} (${node.type})`);

    let output: any;

    try {
      // Execute based on node type
      switch (node.type) {
        case 'start':
          output = input;
          break;

        case 'ai-agent':
          output = await this.executeAIAgent(node.data, input);
          break;

        case 'api-call':
          output = await this.executeAPICall(node.data, input);
          break;

        case 'conditional':
          return await this.executeConditional(node, input);

        case 'transform':
          output = await this.executeTransform(node.data, input);
          break;

        case 'output':
          output = input;
          break;

        default:
          output = input;
      }

      // Record execution
      this.context.history.push({
        nodeId: node.id,
        input,
        output,
        timestamp: new Date().toISOString()
      });

      // Store in variables
      this.context.variables[node.id] = output;

      // Find next node(s)
      const nextEdges = this.edges.filter(edge => edge.source === nodeId);

      if (nextEdges.length === 0) {
        return output; // End of workflow
      }

      // Execute next node (for simplicity, just take first one if multiple)
      const nextEdge = nextEdges[0];
      return await this.executeNode(nextEdge.target, output);

    } catch (error: any) {
      console.error(`Error executing node ${node.data.label}:`, error);
      throw error;
    }
  }

  private async executeAIAgent(data: NodeData, input: any): Promise<string> {
    const prompt = this.interpolateVariables(data.config?.prompt || '');
    const model = data.config?.model || 'gpt-3.5-turbo';

    // Simulated AI response (in production, use OpenAI API)
    console.log(`AI Agent prompt: ${prompt}`);
    console.log(`Input: ${JSON.stringify(input)}`);

    // Mock response
    return `AI Response: Processed "${JSON.stringify(input)}" with prompt "${prompt}" using ${model}`;
  }

  private async executeAPICall(data: NodeData, input: any): Promise<any> {
    const url = this.interpolateVariables(data.config?.apiUrl || '');
    const method = data.config?.method || 'GET';
    const headers = data.config?.headers || {};
    const body = data.config?.body ? this.interpolateVariables(data.config.body) : null;

    console.log(`API Call: ${method} ${url}`);

    // Simulated API call
    return {
      status: 200,
      data: `Mock API response from ${url}`,
      input: input
    };
  }

  private async executeConditional(node: FlowNode, input: any): Promise<any> {
    const condition = node.data.config?.condition || 'true';
    const interpolatedCondition = this.interpolateVariables(condition);

    console.log(`Evaluating condition: ${interpolatedCondition}`);

    // Simple condition evaluation
    let result: boolean;
    try {
      // Very basic evaluation (in production, use safer eval alternative)
      result = eval(interpolatedCondition);
    } catch {
      result = false;
    }

    // Record execution
    this.context.history.push({
      nodeId: node.id,
      input,
      output: result,
      timestamp: new Date().toISOString()
    });

    // Find the appropriate edge (true/false branch)
    const nextEdges = this.edges.filter(edge => edge.source === node.id);
    const selectedEdge = nextEdges.find(edge =>
      (result && edge.label === 'true') || (!result && edge.label === 'false')
    ) || nextEdges[0];

    if (selectedEdge) {
      return await this.executeNode(selectedEdge.target, input);
    }

    return input;
  }

  private async executeTransform(data: NodeData, input: any): Promise<any> {
    const transformCode = data.config?.transformCode || 'return input;';

    console.log(`Transform code: ${transformCode}`);

    try {
      // Create function from code
      const fn = new Function('input', 'variables', transformCode);
      return fn(input, this.context.variables);
    } catch (error: any) {
      console.error('Transform error:', error);
      throw new Error(`Transform failed: ${error.message}`);
    }
  }

  private interpolateVariables(text: string): string {
    // Replace {{variable}} with actual values
    return text.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const value = this.context.variables[key.trim()];
      return value !== undefined ? String(value) : `{{${key}}}`;
    });
  }
}
