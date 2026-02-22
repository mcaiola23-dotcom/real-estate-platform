'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CrmTransaction, TransactionStatus } from '@real-estate/types';

import { TransactionPipeline } from './TransactionPipeline';
import { TransactionCard } from './TransactionCard';
import { TransactionDetailModal } from './TransactionDetailModal';
import { NewTransactionForm, type NewTransactionData } from './NewTransactionForm';
import { EmptyState } from '../shared/EmptyState';

type ViewMode = 'pipeline' | 'list';

interface TransactionsViewProps {
  pushToast: (kind: 'success' | 'error', message: string) => void;
}

export function TransactionsView({ pushToast }: TransactionsViewProps) {
  const [transactions, setTransactions] = useState<CrmTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline');
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [sideFilter, setSideFilter] = useState<string>('all');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '200');
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sideFilter !== 'all') params.set('side', sideFilter);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      setTransactions(json.transactions);
    } catch {
      pushToast('error', 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sideFilter, pushToast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleCreateTransaction = useCallback(async (data: NewTransactionData) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('create failed');
      const json = await res.json();
      setTransactions((prev) => [json.transaction, ...prev]);
      setShowNewForm(false);
      pushToast('success', 'Transaction created.');
    } catch {
      pushToast('error', 'Failed to create transaction.');
    }
  }, [pushToast]);

  const handleStatusChange = useCallback((txnId: string, newStatus: TransactionStatus) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === txnId ? { ...t, status: newStatus } : t))
    );
  }, []);

  const activeCount = transactions.filter(
    (t) => t.status !== 'closed' && t.status !== 'fallen_through'
  ).length;
  const closedCount = transactions.filter((t) => t.status === 'closed').length;
  const totalVolume = transactions
    .filter((t) => t.status === 'closed')
    .reduce((sum, t) => sum + (t.salePrice ?? 0), 0);

  return (
    <section className="crm-txn-view">
      <div className="crm-txn-toolbar">
        <div className="crm-txn-toolbar-left">
          <div className="crm-txn-kpis">
            <div className="crm-txn-kpi">
              <span className="crm-txn-kpi-value">{activeCount}</span>
              <span className="crm-txn-kpi-label">Active</span>
            </div>
            <div className="crm-txn-kpi">
              <span className="crm-txn-kpi-value">{closedCount}</span>
              <span className="crm-txn-kpi-label">Closed</span>
            </div>
            {totalVolume > 0 ? (
              <div className="crm-txn-kpi">
                <span className="crm-txn-kpi-value">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                    notation: 'compact',
                  }).format(totalVolume)}
                </span>
                <span className="crm-txn-kpi-label">Volume</span>
              </div>
            ) : null}
          </div>
        </div>
        <div className="crm-txn-toolbar-right">
          <select
            className="crm-form-select crm-form-select-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | 'all')}
          >
            <option value="all">All Statuses</option>
            <option value="under_contract">Under Contract</option>
            <option value="inspection">Inspection</option>
            <option value="appraisal">Appraisal</option>
            <option value="title">Title</option>
            <option value="closing">Closing</option>
            <option value="closed">Closed</option>
            <option value="fallen_through">Fallen Through</option>
          </select>
          <select
            className="crm-form-select crm-form-select-sm"
            value={sideFilter}
            onChange={(e) => setSideFilter(e.target.value)}
          >
            <option value="all">All Sides</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="dual">Dual</option>
          </select>
          <div className="crm-txn-view-toggle">
            <button
              type="button"
              className={`crm-btn crm-btn-xs ${viewMode === 'pipeline' ? 'crm-btn-primary' : 'crm-btn-ghost'}`}
              onClick={() => setViewMode('pipeline')}
            >
              Pipeline
            </button>
            <button
              type="button"
              className={`crm-btn crm-btn-xs ${viewMode === 'list' ? 'crm-btn-primary' : 'crm-btn-ghost'}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
          <button
            type="button"
            className="crm-btn crm-btn-primary crm-btn-sm"
            onClick={() => setShowNewForm(true)}
          >
            + New Transaction
          </button>
        </div>
      </div>

      {showNewForm ? (
        <div className="crm-modal-overlay" onClick={() => setShowNewForm(false)}>
          <div className="crm-modal crm-txn-new-modal" onClick={(e) => e.stopPropagation()}>
            <NewTransactionForm
              onSubmit={handleCreateTransaction}
              onCancel={() => setShowNewForm(false)}
            />
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="crm-txn-loading">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No transactions yet"
          detail="Create your first transaction to start tracking deals through closing."
        />
      ) : viewMode === 'pipeline' ? (
        <TransactionPipeline
          transactions={transactions}
          onSelectTransaction={(txn) => setSelectedTxnId(txn.id)}
        />
      ) : (
        <div className="crm-txn-list">
          {transactions.map((txn) => (
            <TransactionCard
              key={txn.id}
              transaction={txn}
              onClick={() => setSelectedTxnId(txn.id)}
            />
          ))}
        </div>
      )}

      {selectedTxnId ? (
        <TransactionDetailModal
          transactionId={selectedTxnId}
          onClose={() => setSelectedTxnId(null)}
          onStatusChange={handleStatusChange}
          pushToast={pushToast}
        />
      ) : null}
    </section>
  );
}
