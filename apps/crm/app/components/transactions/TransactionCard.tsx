'use client';

import type { CrmTransaction, TransactionStatus } from '@real-estate/types';

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
  buyer: 'Buyer',
  seller: 'Seller',
  dual: 'Dual',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface TransactionCardProps {
  transaction: CrmTransaction;
  onClick: () => void;
}

export function TransactionCard({ transaction, onClick }: TransactionCardProps) {
  const price = transaction.salePrice ?? transaction.listPrice;
  const closingLabel = transaction.closingDate
    ? `Closing ${formatShortDate(transaction.closingDate)}`
    : null;

  return (
    <button
      type="button"
      className="crm-txn-card"
      onClick={onClick}
    >
      <div className="crm-txn-card-address">{transaction.propertyAddress}</div>
      <div className="crm-txn-card-meta">
        <span className={`crm-txn-side-chip crm-txn-side-chip--${transaction.side}`}>
          {SIDE_LABELS[transaction.side] ?? transaction.side}
        </span>
        {price ? (
          <span className="crm-txn-card-price">{formatCurrency(price)}</span>
        ) : null}
      </div>
      {closingLabel ? (
        <div className="crm-txn-card-closing">{closingLabel}</div>
      ) : null}
      <div className="crm-txn-card-status">
        {STATUS_LABELS[transaction.status] ?? transaction.status}
      </div>
    </button>
  );
}
