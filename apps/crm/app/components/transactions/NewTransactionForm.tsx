'use client';

import { useState, type FormEvent } from 'react';
import type { TransactionSide, TransactionStatus } from '@real-estate/types';

interface NewTransactionFormProps {
  onSubmit: (data: NewTransactionData) => Promise<void>;
  onCancel: () => void;
}

export interface NewTransactionData {
  propertyAddress: string;
  side: TransactionSide;
  status: TransactionStatus;
  listPrice: number | null;
  salePrice: number | null;
  closingDate: string | null;
  contractDate: string | null;
  notes: string | null;
}

export function NewTransactionForm({ onSubmit, onCancel }: NewTransactionFormProps) {
  const [propertyAddress, setPropertyAddress] = useState('');
  const [side, setSide] = useState<TransactionSide>('buyer');
  const [status, setStatus] = useState<TransactionStatus>('under_contract');
  const [listPrice, setListPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [contractDate, setContractDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!propertyAddress.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        propertyAddress: propertyAddress.trim(),
        side,
        status,
        listPrice: listPrice ? Number(listPrice) : null,
        salePrice: salePrice ? Number(salePrice) : null,
        closingDate: closingDate || null,
        contractDate: contractDate || null,
        notes: notes.trim() || null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="crm-txn-form" onSubmit={handleSubmit}>
      <h3 className="crm-txn-form-title">New Transaction</h3>

      <label className="crm-form-label">
        Property Address *
        <input
          type="text"
          className="crm-form-input"
          value={propertyAddress}
          onChange={(e) => setPropertyAddress(e.target.value)}
          required
          placeholder="123 Main St, City, ST 12345"
        />
      </label>

      <div className="crm-txn-form-row">
        <label className="crm-form-label">
          Side *
          <select
            className="crm-form-select"
            value={side}
            onChange={(e) => setSide(e.target.value as TransactionSide)}
          >
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="dual">Dual</option>
          </select>
        </label>

        <label className="crm-form-label">
          Status
          <select
            className="crm-form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as TransactionStatus)}
          >
            <option value="under_contract">Under Contract</option>
            <option value="inspection">Inspection</option>
            <option value="appraisal">Appraisal</option>
            <option value="title">Title</option>
            <option value="closing">Closing</option>
            <option value="closed">Closed</option>
          </select>
        </label>
      </div>

      <div className="crm-txn-form-row">
        <label className="crm-form-label">
          List Price
          <input
            type="number"
            className="crm-form-input"
            value={listPrice}
            onChange={(e) => setListPrice(e.target.value)}
            placeholder="350000"
          />
        </label>

        <label className="crm-form-label">
          Sale Price
          <input
            type="number"
            className="crm-form-input"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            placeholder="345000"
          />
        </label>
      </div>

      <div className="crm-txn-form-row">
        <label className="crm-form-label">
          Contract Date
          <input
            type="date"
            className="crm-form-input"
            value={contractDate}
            onChange={(e) => setContractDate(e.target.value)}
          />
        </label>

        <label className="crm-form-label">
          Closing Date
          <input
            type="date"
            className="crm-form-input"
            value={closingDate}
            onChange={(e) => setClosingDate(e.target.value)}
          />
        </label>
      </div>

      <label className="crm-form-label">
        Notes
        <textarea
          className="crm-form-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Transaction notes..."
        />
      </label>

      <div className="crm-txn-form-actions">
        <button type="button" className="crm-btn crm-btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="crm-btn crm-btn-primary" disabled={submitting || !propertyAddress.trim()}>
          {submitting ? 'Creating...' : 'Create Transaction'}
        </button>
      </div>
    </form>
  );
}
