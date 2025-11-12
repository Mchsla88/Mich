import React, { useState } from 'react';
import { Play, Save, FolderOpen, Trash2 } from 'lucide-react';

interface ToolbarProps {
  workflowName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onLoad: () => void;
  onRun: () => void;
  onClear: () => void;
  isExecuting: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  workflowName,
  onNameChange,
  onSave,
  onLoad,
  onRun,
  onClear,
  isExecuting
}) => {
  return (
    <div
      style={{
        height: '64px',
        background: '#1a1a1a',
        borderBottom: '1px solid #333',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>
          🤖 Agent Builder
        </h1>
        <input
          type="text"
          value={workflowName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Workflow Name"
          style={{ width: '200px' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onSave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#059669'
          }}
        >
          <Save size={16} />
          Save
        </button>

        <button
          onClick={onLoad}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#0891b2'
          }}
        >
          <FolderOpen size={16} />
          Load
        </button>

        <button
          onClick={onRun}
          disabled={isExecuting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: isExecuting ? '#374151' : '#6366f1'
          }}
        >
          <Play size={16} />
          {isExecuting ? 'Running...' : 'Run Workflow'}
        </button>

        <button
          onClick={onClear}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#dc2626'
          }}
        >
          <Trash2 size={16} />
          Clear
        </button>
      </div>
    </div>
  );
};
