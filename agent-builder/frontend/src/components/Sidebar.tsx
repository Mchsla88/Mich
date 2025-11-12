import React from 'react';
import {
  Play,
  Bot,
  Globe,
  GitBranch,
  Code,
  Flag
} from 'lucide-react';
import { NodeType } from '../types';

interface NodeTemplate {
  type: NodeType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const nodeTemplates: NodeTemplate[] = [
  {
    type: 'start',
    label: 'Start',
    icon: <Play size={18} />,
    description: 'Entry point of the workflow'
  },
  {
    type: 'ai-agent',
    label: 'AI Agent',
    icon: <Bot size={18} />,
    description: 'Call an AI model with a prompt'
  },
  {
    type: 'api-call',
    label: 'API Call',
    icon: <Globe size={18} />,
    description: 'Make HTTP request to external API'
  },
  {
    type: 'conditional',
    label: 'Conditional',
    icon: <GitBranch size={18} />,
    description: 'Branch based on a condition'
  },
  {
    type: 'transform',
    label: 'Transform',
    icon: <Code size={18} />,
    description: 'Transform data with custom code'
  },
  {
    type: 'output',
    label: 'Output',
    icon: <Flag size={18} />,
    description: 'Final output of the workflow'
  }
];

interface SidebarProps {
  onAddNode: (type: NodeType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onAddNode }) => {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      style={{
        width: '280px',
        background: '#1a1a1a',
        borderRight: '1px solid #333',
        padding: '20px',
        overflowY: 'auto'
      }}
    >
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
        Node Types
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {nodeTemplates.map((template) => (
          <div
            key={template.type}
            draggable
            onDragStart={(e) => onDragStart(e, template.type)}
            onClick={() => onAddNode(template.type)}
            style={{
              padding: '12px',
              background: '#0f0f0f',
              border: '1px solid #333',
              borderRadius: '8px',
              cursor: 'grab',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#333';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ color: '#6366f1' }}>{template.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>
                {template.label}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', paddingLeft: '28px' }}>
              {template.description}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', padding: '16px', background: '#0f0f0f', borderRadius: '8px', border: '1px solid #333' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
          How to use:
        </h3>
        <ul style={{ fontSize: '12px', color: '#9ca3af', paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>Drag nodes to canvas</li>
          <li>Connect nodes by dragging from handles</li>
          <li>Click nodes to configure</li>
          <li>Click "Run Workflow" to execute</li>
        </ul>
      </div>
    </div>
  );
};
