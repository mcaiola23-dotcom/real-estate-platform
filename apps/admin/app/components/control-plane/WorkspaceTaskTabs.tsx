import type { AdminWorkspaceTab } from '../../lib/action-center';
import type { WorkspaceTaskMetric } from '../../lib/workspace-task-metrics';

interface WorkspaceTaskTabsProps {
  activeTab: AdminWorkspaceTab;
  metrics: WorkspaceTaskMetric[];
  onSelect: (tab: AdminWorkspaceTab) => void;
}

export function WorkspaceTaskTabs({ activeTab, metrics, onSelect }: WorkspaceTaskTabsProps) {
  return (
    <section className="admin-card admin-workspace-tabs" aria-label="Workspace task tabs">
      <div className="admin-card-head admin-card-head-wrap">
        <div className="admin-title-block">
          <h2>Workspace Tasks</h2>
          <p className="admin-muted">
            Switch between focused task views to reduce noise while working through tenant setup and operations.
          </p>
        </div>
      </div>
      <div className="admin-tab-grid" role="tablist" aria-label="Workspace task categories">
        {metrics.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`admin-tab-button ${isActive ? 'is-active' : ''}`}
              onClick={() => {
                onSelect(tab.id);
              }}
            >
              <span>{tab.label}</span>
              <small>
                {tab.count}
                {tab.countLabel}
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
