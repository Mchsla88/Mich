import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Play,
  Bot,
  Globe,
  GitBranch,
  Code,
  Flag
} from 'lucide-react';
import { NodeType } from '../types';

const getNodeIcon = (type: NodeType) => {
  switch (type) {
    case 'start': return <Play size={16} />;
    case 'ai-agent': return <Bot size={16} />;
    case 'api-call': return <Globe size={16} />;
    case 'conditional': return <GitBranch size={16} />;
    case 'transform': return <Code size={16} />;
    case 'output': return <Flag size={16} />;
    default: return null;
  }
};

const getNodeColor = (type: NodeType) => {
  switch (type) {
    case 'start': return '#10b981';
    case 'ai-agent': return '#8b5cf6';
    case 'api-call': return '#3b82f6';
    case 'conditional': return '#f59e0b';
    case 'transform': return '#ec4899';
    case 'output': return '#ef4444';
    default: return '#6366f1';
  }
};

export const CustomNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeType = data.type as NodeType;
  const color = getNodeColor(nodeType);

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        border: `2px solid ${selected ? color : '#333'}`,
        background: '#1a1a1a',
        minWidth: '180px',
        boxShadow: selected ? `0 0 0 2px ${color}33` : 'none',
      }}
    >
      {nodeType !== 'start' && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: color }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ color }}>{getNodeIcon(nodeType)}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>
            {data.label}
          </div>
          {data.config?.prompt && (
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
              {data.config.prompt.substring(0, 30)}...
            </div>
          )}
          {data.config?.apiUrl && (
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
              {data.config.method} {data.config.apiUrl.substring(0, 20)}...
            </div>
          )}
        </div>
      </div>

      {nodeType !== 'output' && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: color }}
        />
      )}
    </div>
  );
};
