import type { ActionCenterItem } from '../../lib/action-center';

interface ActionCenterPanelProps {
  selectedTenantName: string | null;
  items: ActionCenterItem[];
  onOpen: (item: ActionCenterItem) => void;
}

export function ActionCenterPanel({ selectedTenantName, items, onOpen }: ActionCenterPanelProps) {
  return (
    <section className="admin-card admin-action-center" aria-label="Tenant action center">
      <div className="admin-card-head admin-card-head-wrap">
        <div className="admin-title-block">
          <h2>Action Center</h2>
          <p className="admin-muted">
            Prioritized next actions for the selected tenant across launch setup, support, billing, access, and audit workflows.
          </p>
        </div>
        {selectedTenantName ? <span className="admin-chip">tenant: {selectedTenantName}</span> : null}
      </div>
      <ul className="admin-action-list">
        {items.map((item) => (
          <li key={item.id} className={`admin-action-item is-${item.severity}`}>
            <div>
              <div className="admin-row">
                <span
                  className={`admin-chip ${
                    item.severity === 'critical'
                      ? 'admin-chip-status-failed'
                      : item.severity === 'warning'
                        ? 'admin-chip-warn'
                        : 'admin-chip'
                  }`}
                >
                  {item.severity}
                </span>
                <span className="admin-chip">tab: {item.tab}</span>
              </div>
              <strong>{item.title}</strong>
              <p className="admin-muted">{item.detail}</p>
            </div>
            <button
              type="button"
              className="admin-secondary"
              onClick={() => {
                onOpen(item);
              }}
            >
              Open
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
