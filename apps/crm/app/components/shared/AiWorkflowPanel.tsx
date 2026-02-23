'use client';

import { useState } from 'react';

interface WorkflowToggle {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_WORKFLOWS: WorkflowToggle[] = [
  {
    id: 'auto-respond',
    label: 'Auto-Respond to New Leads',
    description: 'Automatically send a welcome email when a new lead is created.',
    enabled: false,
  },
  {
    id: 'auto-followup',
    label: 'Auto-Schedule Follow-Ups',
    description: 'AI suggests and schedules follow-up reminders based on lead activity.',
    enabled: false,
  },
  {
    id: 'auto-score',
    label: 'Auto-Score Leads',
    description: 'Automatically update lead scores based on engagement signals.',
    enabled: true,
  },
];

export function AiWorkflowPanel() {
  const [workflows, setWorkflows] = useState<WorkflowToggle[]>(DEFAULT_WORKFLOWS);

  const toggleWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  };

  return (
    <div className="crm-ai-workflow-panel">
      <div className="crm-panel-head">
        <h4>AI Workflows</h4>
        <span className="crm-muted">Configure AI-powered automation for your pipeline.</span>
      </div>

      <div className="crm-ai-workflow-list">
        {workflows.map((workflow) => (
          <label key={workflow.id} className="crm-ai-workflow-item">
            <div className="crm-ai-workflow-info">
              <strong>{workflow.label}</strong>
              <span className="crm-muted">{workflow.description}</span>
            </div>
            <input
              type="checkbox"
              checked={workflow.enabled}
              onChange={() => toggleWorkflow(workflow.id)}
              className="crm-ai-workflow-toggle"
            />
          </label>
        ))}
      </div>

      <p className="crm-muted" style={{ fontSize: '0.72rem', marginTop: '0.5rem' }}>
        AI workflows process in the background. All AI-suggested actions can be reviewed before execution.
      </p>
    </div>
  );
}
