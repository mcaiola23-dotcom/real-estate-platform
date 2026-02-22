'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  CrmTransactionWithRelations,
  CrmTransactionParty,
  CrmTransactionDocument,
  CrmTransactionMilestone,
  TransactionStatus,
} from '@real-estate/types';

const STATUS_LABELS: Record<TransactionStatus, string> = {
  under_contract: 'Under Contract',
  inspection: 'Inspection',
  appraisal: 'Appraisal',
  title: 'Title',
  closing: 'Closing',
  closed: 'Closed',
  fallen_through: 'Fallen Through',
};

const SIDE_LABELS: Record<string, string> = {
  buyer: 'Buyer Side',
  seller: 'Seller Side',
  dual: 'Dual Agency',
};

const DOC_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  received: 'Received',
  reviewed: 'Reviewed',
  approved: 'Approved',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface TransactionDetailModalProps {
  transactionId: string;
  onClose: () => void;
  onStatusChange: (txnId: string, newStatus: TransactionStatus) => void;
  pushToast: (kind: 'success' | 'error', message: string) => void;
}

type DetailTab = 'overview' | 'parties' | 'documents' | 'milestones';

export function TransactionDetailModal({
  transactionId,
  onClose,
  onStatusChange,
  pushToast,
}: TransactionDetailModalProps) {
  const [txn, setTxn] = useState<CrmTransactionWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [addingParty, setAddingParty] = useState(false);
  const [addingDoc, setAddingDoc] = useState(false);
  const [addingMilestone, setAddingMilestone] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions/${transactionId}`);
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      setTxn(json.transaction);
    } catch {
      pushToast('error', 'Failed to load transaction details.');
    } finally {
      setLoading(false);
    }
  }, [transactionId, pushToast]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  async function handleStatusUpdate(newStatus: TransactionStatus) {
    try {
      const res = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('update failed');
      const json = await res.json();
      setTxn((prev) => prev ? { ...prev, ...json.transaction } : prev);
      onStatusChange(transactionId, newStatus);
      pushToast('success', `Transaction moved to ${STATUS_LABELS[newStatus]}.`);
    } catch {
      pushToast('error', 'Failed to update transaction status.');
    }
  }

  async function handleAddParty(data: { role: string; name: string; email?: string; phone?: string; company?: string }) {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/parties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('add failed');
      const json = await res.json();
      setTxn((prev) => prev ? { ...prev, parties: [...prev.parties, json.party] } : prev);
      setAddingParty(false);
      pushToast('success', 'Party added.');
    } catch {
      pushToast('error', 'Failed to add party.');
    }
  }

  async function handleAddDocument(data: { documentType: string; fileName: string }) {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('add failed');
      const json = await res.json();
      setTxn((prev) => prev ? { ...prev, documents: [json.document, ...prev.documents] } : prev);
      setAddingDoc(false);
      pushToast('success', 'Document added.');
    } catch {
      pushToast('error', 'Failed to add document.');
    }
  }

  async function handleAddMilestone(data: { milestoneType: string; scheduledAt?: string }) {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('add failed');
      const json = await res.json();
      setTxn((prev) => prev ? { ...prev, milestones: [...prev.milestones, json.milestone] } : prev);
      setAddingMilestone(false);
      pushToast('success', 'Milestone added.');
    } catch {
      pushToast('error', 'Failed to add milestone.');
    }
  }

  async function handleCompleteMilestone(milestoneId: string) {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('update failed');
      const json = await res.json();
      setTxn((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          milestones: prev.milestones.map((m) => m.id === milestoneId ? json.milestone : m),
        };
      });
      pushToast('success', 'Milestone completed.');
    } catch {
      pushToast('error', 'Failed to complete milestone.');
    }
  }

  const tabs: Array<{ id: DetailTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'parties', label: `Parties${txn ? ` (${txn.parties.length})` : ''}` },
    { id: 'documents', label: `Documents${txn ? ` (${txn.documents.length})` : ''}` },
    { id: 'milestones', label: `Milestones${txn ? ` (${txn.milestones.length})` : ''}` },
  ];

  return (
    <div className="crm-modal-overlay" onClick={onClose}>
      <div className="crm-modal crm-txn-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crm-modal-header">
          <h2 className="crm-modal-title">
            {loading ? 'Loading...' : txn?.propertyAddress ?? 'Transaction'}
          </h2>
          <button type="button" className="crm-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {txn ? (
          <>
            <div className="crm-txn-detail-badges">
              <span className={`crm-txn-status-badge crm-txn-status-badge--${txn.status}`}>
                {STATUS_LABELS[txn.status]}
              </span>
              <span className={`crm-txn-side-chip crm-txn-side-chip--${txn.side}`}>
                {SIDE_LABELS[txn.side] ?? txn.side}
              </span>
            </div>

            <nav className="crm-txn-detail-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`crm-txn-detail-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="crm-txn-detail-body">
              {activeTab === 'overview' ? (
                <OverviewPane txn={txn} onStatusUpdate={handleStatusUpdate} />
              ) : null}
              {activeTab === 'parties' ? (
                <PartiesPane
                  parties={txn.parties}
                  adding={addingParty}
                  onToggleAdd={() => setAddingParty((p) => !p)}
                  onAdd={handleAddParty}
                />
              ) : null}
              {activeTab === 'documents' ? (
                <DocumentsPane
                  documents={txn.documents}
                  adding={addingDoc}
                  onToggleAdd={() => setAddingDoc((p) => !p)}
                  onAdd={handleAddDocument}
                />
              ) : null}
              {activeTab === 'milestones' ? (
                <MilestonesPane
                  milestones={txn.milestones}
                  adding={addingMilestone}
                  onToggleAdd={() => setAddingMilestone((p) => !p)}
                  onAdd={handleAddMilestone}
                  onComplete={handleCompleteMilestone}
                />
              ) : null}
            </div>
          </>
        ) : loading ? (
          <div className="crm-txn-detail-loading">Loading transaction details...</div>
        ) : null}
      </div>
    </div>
  );
}

function OverviewPane({
  txn,
  onStatusUpdate,
}: {
  txn: CrmTransactionWithRelations;
  onStatusUpdate: (s: TransactionStatus) => void;
}) {
  const dates: Array<{ label: string; value: string | null }> = [
    { label: 'Contract Date', value: txn.contractDate },
    { label: 'Inspection Date', value: txn.inspectionDate },
    { label: 'Appraisal Date', value: txn.appraisalDate },
    { label: 'Title Date', value: txn.titleDate },
    { label: 'Closing Date', value: txn.closingDate },
  ];

  const activeStatuses: TransactionStatus[] = [
    'under_contract', 'inspection', 'appraisal', 'title', 'closing', 'closed',
  ];

  return (
    <div className="crm-txn-overview">
      <div className="crm-txn-overview-grid">
        {txn.listPrice ? (
          <div className="crm-txn-stat">
            <span className="crm-txn-stat-label">List Price</span>
            <span className="crm-txn-stat-value">{formatCurrency(txn.listPrice)}</span>
          </div>
        ) : null}
        {txn.salePrice ? (
          <div className="crm-txn-stat">
            <span className="crm-txn-stat-label">Sale Price</span>
            <span className="crm-txn-stat-value">{formatCurrency(txn.salePrice)}</span>
          </div>
        ) : null}
      </div>

      <div className="crm-txn-dates">
        <h4 className="crm-txn-section-heading">Key Dates</h4>
        {dates.map((d) => (
          <div key={d.label} className="crm-txn-date-row">
            <span className="crm-txn-date-label">{d.label}</span>
            <span className="crm-txn-date-value">{d.value ? formatDate(d.value) : '—'}</span>
          </div>
        ))}
      </div>

      {txn.notes ? (
        <div className="crm-txn-notes-section">
          <h4 className="crm-txn-section-heading">Notes</h4>
          <p className="crm-txn-notes-body">{txn.notes}</p>
        </div>
      ) : null}

      {txn.status !== 'closed' && txn.status !== 'fallen_through' ? (
        <div className="crm-txn-status-actions">
          <h4 className="crm-txn-section-heading">Move Stage</h4>
          <div className="crm-txn-status-btns">
            {activeStatuses
              .filter((s) => s !== txn.status)
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  className="crm-btn crm-btn-ghost crm-btn-xs"
                  onClick={() => onStatusUpdate(s)}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            <button
              type="button"
              className="crm-btn crm-btn-danger crm-btn-xs"
              onClick={() => onStatusUpdate('fallen_through')}
            >
              Fallen Through
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PartiesPane({
  parties,
  adding,
  onToggleAdd,
  onAdd,
}: {
  parties: CrmTransactionParty[];
  adding: boolean;
  onToggleAdd: () => void;
  onAdd: (data: { role: string; name: string; email?: string; phone?: string; company?: string }) => void;
}) {
  const [role, setRole] = useState('buyer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');

  return (
    <div className="crm-txn-parties">
      <div className="crm-txn-pane-toolbar">
        <button type="button" className="crm-btn crm-btn-primary crm-btn-sm" onClick={onToggleAdd}>
          {adding ? 'Cancel' : '+ Add Party'}
        </button>
      </div>

      {adding ? (
        <div className="crm-txn-inline-form">
          <select className="crm-form-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="buyer_agent">Buyer Agent</option>
            <option value="seller_agent">Seller Agent</option>
            <option value="lender">Lender</option>
            <option value="attorney">Attorney</option>
            <option value="title_company">Title Company</option>
            <option value="inspector">Inspector</option>
            <option value="appraiser">Appraiser</option>
            <option value="other">Other</option>
          </select>
          <input className="crm-form-input" placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="crm-form-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="crm-form-input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="crm-form-input" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
          <button
            type="button"
            className="crm-btn crm-btn-primary crm-btn-sm"
            disabled={!name.trim()}
            onClick={() => {
              onAdd({ role, name: name.trim(), email: email || undefined, phone: phone || undefined, company: company || undefined });
              setName(''); setEmail(''); setPhone(''); setCompany('');
            }}
          >
            Save
          </button>
        </div>
      ) : null}

      {parties.length === 0 ? (
        <p className="crm-txn-empty-hint">No parties added yet.</p>
      ) : (
        <div className="crm-txn-party-list">
          {parties.map((p) => (
            <div key={p.id} className="crm-txn-party-row">
              <span className="crm-txn-party-role">{p.role.replace(/_/g, ' ')}</span>
              <span className="crm-txn-party-name">{p.name}</span>
              {p.company ? <span className="crm-txn-party-company">{p.company}</span> : null}
              {p.email ? <a href={`mailto:${p.email}`} className="crm-txn-party-contact">{p.email}</a> : null}
              {p.phone ? <a href={`tel:${p.phone}`} className="crm-txn-party-contact">{p.phone}</a> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentsPane({
  documents,
  adding,
  onToggleAdd,
  onAdd,
}: {
  documents: CrmTransactionDocument[];
  adding: boolean;
  onToggleAdd: () => void;
  onAdd: (data: { documentType: string; fileName: string }) => void;
}) {
  const [docType, setDocType] = useState('contract');
  const [fileName, setFileName] = useState('');

  return (
    <div className="crm-txn-documents">
      <div className="crm-txn-pane-toolbar">
        <button type="button" className="crm-btn crm-btn-primary crm-btn-sm" onClick={onToggleAdd}>
          {adding ? 'Cancel' : '+ Add Document'}
        </button>
      </div>

      {adding ? (
        <div className="crm-txn-inline-form">
          <select className="crm-form-select" value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option value="contract">Contract</option>
            <option value="addendum">Addendum</option>
            <option value="disclosure">Disclosure</option>
            <option value="inspection_report">Inspection Report</option>
            <option value="appraisal_report">Appraisal Report</option>
            <option value="title_report">Title Report</option>
            <option value="loan_docs">Loan Documents</option>
            <option value="hoa_docs">HOA Documents</option>
            <option value="other">Other</option>
          </select>
          <input className="crm-form-input" placeholder="File name *" value={fileName} onChange={(e) => setFileName(e.target.value)} />
          <button
            type="button"
            className="crm-btn crm-btn-primary crm-btn-sm"
            disabled={!fileName.trim()}
            onClick={() => {
              onAdd({ documentType: docType, fileName: fileName.trim() });
              setFileName('');
            }}
          >
            Save
          </button>
        </div>
      ) : null}

      {documents.length === 0 ? (
        <p className="crm-txn-empty-hint">No documents tracked yet.</p>
      ) : (
        <div className="crm-txn-doc-list">
          {documents.map((d) => (
            <div key={d.id} className="crm-txn-doc-row">
              <span className="crm-txn-doc-type">{d.documentType.replace(/_/g, ' ')}</span>
              <span className="crm-txn-doc-name">{d.fileName}</span>
              <span className={`crm-txn-doc-status crm-txn-doc-status--${d.status}`}>
                {DOC_STATUS_LABELS[d.status] ?? d.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MilestonesPane({
  milestones,
  adding,
  onToggleAdd,
  onAdd,
  onComplete,
}: {
  milestones: CrmTransactionMilestone[];
  adding: boolean;
  onToggleAdd: () => void;
  onAdd: (data: { milestoneType: string; scheduledAt?: string }) => void;
  onComplete: (milestoneId: string) => void;
}) {
  const [milestoneType, setMilestoneType] = useState('contract_signed');
  const [scheduledAt, setScheduledAt] = useState('');

  return (
    <div className="crm-txn-milestones">
      <div className="crm-txn-pane-toolbar">
        <button type="button" className="crm-btn crm-btn-primary crm-btn-sm" onClick={onToggleAdd}>
          {adding ? 'Cancel' : '+ Add Milestone'}
        </button>
      </div>

      {adding ? (
        <div className="crm-txn-inline-form">
          <select className="crm-form-select" value={milestoneType} onChange={(e) => setMilestoneType(e.target.value)}>
            <option value="contract_signed">Contract Signed</option>
            <option value="earnest_money_deposited">Earnest Money Deposited</option>
            <option value="inspection_scheduled">Inspection Scheduled</option>
            <option value="inspection_completed">Inspection Completed</option>
            <option value="appraisal_ordered">Appraisal Ordered</option>
            <option value="appraisal_completed">Appraisal Completed</option>
            <option value="title_search">Title Search</option>
            <option value="title_cleared">Title Cleared</option>
            <option value="loan_approval">Loan Approval</option>
            <option value="final_walkthrough">Final Walkthrough</option>
            <option value="closing_scheduled">Closing Scheduled</option>
            <option value="closing_completed">Closing Completed</option>
            <option value="possession_transferred">Possession Transferred</option>
          </select>
          <input
            type="date"
            className="crm-form-input"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            placeholder="Scheduled date"
          />
          <button
            type="button"
            className="crm-btn crm-btn-primary crm-btn-sm"
            onClick={() => {
              onAdd({ milestoneType, scheduledAt: scheduledAt || undefined });
              setScheduledAt('');
            }}
          >
            Save
          </button>
        </div>
      ) : null}

      {milestones.length === 0 ? (
        <p className="crm-txn-empty-hint">No milestones tracked yet.</p>
      ) : (
        <div className="crm-txn-milestone-list">
          {milestones.map((m) => (
            <div key={m.id} className={`crm-txn-milestone-row ${m.completedAt ? 'is-completed' : ''}`}>
              <span className="crm-txn-milestone-check">
                {m.completedAt ? '✓' : (
                  <button
                    type="button"
                    className="crm-txn-milestone-complete-btn"
                    onClick={() => onComplete(m.id)}
                    title="Mark complete"
                  >
                    ○
                  </button>
                )}
              </span>
              <span className="crm-txn-milestone-type">{m.milestoneType.replace(/_/g, ' ')}</span>
              {m.scheduledAt ? (
                <span className="crm-txn-milestone-date">{formatDate(m.scheduledAt)}</span>
              ) : null}
              {m.completedAt ? (
                <span className="crm-txn-milestone-completed">Done {formatDate(m.completedAt)}</span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
