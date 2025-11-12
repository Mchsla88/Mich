import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { CustomNode } from './nodes/CustomNode';
import { Sidebar } from './components/Sidebar';
import { ConfigPanel } from './components/ConfigPanel';
import { Toolbar } from './components/Toolbar';
import { NodeType, Workflow } from './types';
import axios from 'axios';

const nodeTypes = {
  start: CustomNode,
  'ai-agent': CustomNode,
  'api-call': CustomNode,
  conditional: CustomNode,
  transform: CustomNode,
  output: CustomNode,
};

const API_URL = 'http://localhost:3001/api';

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

function App() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState('My Workflow');
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const addNode = useCallback((type: NodeType) => {
    const newNode: Node = {
      id: getNodeId(),
      type: type,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
        type: type,
        config: {},
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, []);

  const updateNodeData = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data };
        }
        return node;
      })
    );
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow') as NodeType;

      if (typeof type === 'undefined' || !type || !reactFlowBounds) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left - 90,
        y: event.clientY - reactFlowBounds.top - 20,
      };

      const newNode: Node = {
        id: getNodeId(),
        type,
        position,
        data: {
          label: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
          type: type,
          config: {},
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleSave = async () => {
    const workflow: Workflow = {
      name: workflowName,
      nodes,
      edges,
    };

    try {
      if (currentWorkflowId) {
        await axios.put(`${API_URL}/workflows/${currentWorkflowId}`, workflow);
        alert('Workflow updated successfully!');
      } else {
        const response = await axios.post(`${API_URL}/workflows`, workflow);
        setCurrentWorkflowId(response.data.id);
        alert('Workflow saved successfully!');
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Failed to save workflow. Make sure the backend is running.');
    }
  };

  const handleLoad = async () => {
    try {
      const response = await axios.get(`${API_URL}/workflows`);
      const workflows = response.data;

      if (workflows.length === 0) {
        alert('No saved workflows found.');
        return;
      }

      // For simplicity, load the most recent workflow
      const latestWorkflow = workflows[workflows.length - 1];
      setWorkflowName(latestWorkflow.name);
      setNodes(latestWorkflow.nodes);
      setEdges(latestWorkflow.edges);
      setCurrentWorkflowId(latestWorkflow.id);
      alert(`Loaded workflow: ${latestWorkflow.name}`);
    } catch (error) {
      console.error('Error loading workflows:', error);
      alert('Failed to load workflows. Make sure the backend is running.');
    }
  };

  const handleRun = async () => {
    if (nodes.length === 0) {
      alert('Please add nodes to the workflow first.');
      return;
    }

    setIsExecuting(true);

    try {
      // Save workflow first if not saved
      let workflowId = currentWorkflowId;
      if (!workflowId) {
        const workflow: Workflow = {
          name: workflowName,
          nodes,
          edges,
        };
        const response = await axios.post(`${API_URL}/workflows`, workflow);
        workflowId = response.data.id;
        setCurrentWorkflowId(workflowId);
      }

      // Execute workflow
      const inputData = prompt('Enter input data (JSON format):', '{"message": "Hello"}');
      const input = inputData ? JSON.parse(inputData) : {};

      const response = await axios.post(`${API_URL}/workflows/${workflowId}/execute`, {
        input,
      });

      console.log('Execution result:', response.data);

      if (response.data.success) {
        alert(`Workflow executed successfully!\n\nOutput: ${JSON.stringify(response.data.output, null, 2)}`);
      } else {
        alert(`Workflow execution failed:\n${response.data.error}`);
      }
    } catch (error: any) {
      console.error('Error executing workflow:', error);
      alert(`Failed to execute workflow: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the workflow?')) {
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
      setCurrentWorkflowId(null);
      nodeId = 0;
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        workflowName={workflowName}
        onNameChange={setWorkflowName}
        onSave={handleSave}
        onLoad={handleLoad}
        onRun={handleRun}
        onClear={handleClear}
        isExecuting={isExecuting}
      />

      <div style={{ flex: 1, display: 'flex' }}>
        <Sidebar onAddNode={addNode} />

        <div ref={reactFlowWrapper} style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#333" />
            <Controls />
          </ReactFlow>
        </div>

        <ConfigPanel
          selectedNode={selectedNode}
          onUpdate={updateNodeData}
          onClose={() => setSelectedNode(null)}
        />
      </div>
    </div>
  );
}

export default App;
