'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CrmESignatureRequest } from '@real-estate/types/crm';

interface ESignaturePanelProps {
  transactionId?: string;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'crm-esig-badge crm-esig-badge-pending';
    case 'sent':
      return 'crm-esig-badge crm-esig-badge-sent';
    case 'signed':
      return 'crm-esig-badge crm-esig-badge-signed';
    case 'expired':
      return 'crm-esig-badge crm-esig-badge-expired';
    default:
      return 'crm-esig-badge';
  }
}

export function ESignaturePanel({ transactionId }: ESignaturePanelProps) {
  const [requests, setRequests] = useState<CrmESignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [documentName, setDocumentName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (transactionId) {
        params.set('transactionId', transactionId);
      }
      const res = await fetch(`/api/esignatures?${params.toString()}`);
      const data = await res.json();
      if (data.ok && data.esignatures) {
        setRequests(data.esignatures);
      } else {
        setError(data.error || 'Failed to load e-signature requests.');
      }
    } catch {
      setError('Network error loading e-signature requests.');
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!documentName.trim() || !recipientEmail.trim()) return;

      setSaving(true);
      setFormError('');

      try {
        const res = await fetch('/api/esignatures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentName: documentName.trim(),
            recipientEmail: recipientEmail.trim(),
            transactionId: transactionId || null,
          }),
        });

        const data = await res.json();
        if (data.ok && data.esignature) {
          setRequests((prev) => [data.esignature, ...prev]);
          setDocumentName('');
          setRecipientEmail('');
        } else {
          setFormError(data.error || 'Failed to create signature request.');
        }
      } catch {
        setFormError('Network error. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [documentName, recipientEmail, transactionId]
  );

  return (
    <div className="crm-esig-panel">
      <h4 className="crm-esig-panel-title">E-Signature Requests</h4>

      {/* New Signature Request Form */}
      <form className="crm-esig-form" onSubmit={handleSubmit}>
        <label className="crm-field">
          Document Name
          <input
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            placeholder="Purchase Agreement, Listing Contract..."
            required
          />
        </label>

        <label className="crm-field">
          Recipient Email
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="client@example.com"
            required
          />
        </label>

        {formError && <p className="crm-banner-warning">{formError}</p>}

        <button
          type="submit"
          className="crm-primary-button"
          disabled={saving || !documentName.trim() || !recipientEmail.trim()}
        >
          {saving ? 'Sending...' : 'New Signature Request'}
        </button>
      </form>

      {/* Request List */}
      {loading && <p className="crm-muted">Loading signature requests...</p>}

      {error && <p className="crm-banner-warning">{error}</p>}

      {!loading && !error && requests.length === 0 && (
        <p className="crm-muted">No signature requests yet.</p>
      )}

      {!loading && requests.length > 0 && (
        <div className="crm-esig-list">
          {requests.map((req) => (
            <div key={req.id} className="crm-esig-item">
              <div className="crm-esig-item-header">
                <strong className="crm-esig-doc-name">{req.documentName}</strong>
                <span className={statusBadgeClass(req.status)}>{req.status}</span>
              </div>
              <div className="crm-esig-item-details">
                <span className="crm-muted">{req.recipientEmail}</span>
                {req.sentAt && (
                  <span className="crm-muted">
                    Sent: {new Date(req.sentAt).toLocaleDateString()}
                  </span>
                )}
                {req.signedAt && (
                  <span className="crm-muted">
                    Signed: {new Date(req.signedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
