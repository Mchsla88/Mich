import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { NodeType } from '../types';

interface ConfigPanelProps {
  selectedNode: any;
  onUpdate: (nodeId: string, data: any) => void;
  onClose: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  selectedNode,
  onUpdate,
  onClose
}) => {
  const [config, setConfig] = useState(selectedNode?.data?.config || {});
  const [label, setLabel] = useState(selectedNode?.data?.label || '');

  useEffect(() => {
    if (selectedNode) {
      setConfig(selectedNode.data?.config || {});
      setLabel(selectedNode.data?.label || '');
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div
        style={{
          width: '320px',
          background: '#1a1a1a',
          borderLeft: '1px solid #333',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af'
        }}
      >
        Select a node to configure
      </div>
    );
  }

  const handleSave = () => {
    onUpdate(selectedNode.id, {
      ...selectedNode.data,
      label,
      config
    });
  };

  const nodeType = selectedNode.data.type as NodeType;

  return (
    <div
      style={{
        width: '320px',
        background: '#1a1a1a',
        borderLeft: '1px solid #333',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        overflowY: 'auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Configure Node</h2>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div>
        <label>Node Label</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Enter node label"
        />
      </div>

      {nodeType === 'ai-agent' && (
        <>
          <div>
            <label>Prompt</label>
            <textarea
              rows={4}
              value={config.prompt || ''}
              onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
              placeholder="Enter your prompt here. Use {{variable}} for interpolation."
            />
          </div>
          <div>
            <label>Model</label>
            <select
              value={config.model || 'gpt-3.5-turbo'}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
            >
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>
        </>
      )}

      {nodeType === 'api-call' && (
        <>
          <div>
            <label>API URL</label>
            <input
              type="text"
              value={config.apiUrl || ''}
              onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
              placeholder="https://api.example.com/endpoint"
            />
          </div>
          <div>
            <label>Method</label>
            <select
              value={config.method || 'GET'}
              onChange={(e) => setConfig({ ...config, method: e.target.value })}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
          {(config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH') && (
            <div>
              <label>Body (JSON)</label>
              <textarea
                rows={4}
                value={config.body || ''}
                onChange={(e) => setConfig({ ...config, body: e.target.value })}
                placeholder='{"key": "value"}'
              />
            </div>
          )}
        </>
      )}

      {nodeType === 'conditional' && (
        <div>
          <label>Condition (JavaScript)</label>
          <textarea
            rows={3}
            value={config.condition || ''}
            onChange={(e) => setConfig({ ...config, condition: e.target.value })}
            placeholder="input.value > 10"
          />
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
            Use 'input' for current data and 'variables' for stored values
          </div>
        </div>
      )}

      {nodeType === 'transform' && (
        <div>
          <label>Transform Code (JavaScript)</label>
          <textarea
            rows={6}
            value={config.transformCode || ''}
            onChange={(e) => setConfig({ ...config, transformCode: e.target.value })}
            placeholder="return { transformed: input.value * 2 };"
          />
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
            Function receives 'input' and 'variables', must return a value
          </div>
        </div>
      )}

      <button onClick={handleSave} style={{ marginTop: '10px' }}>
        Save Configuration
      </button>
    </div>
  );
};
