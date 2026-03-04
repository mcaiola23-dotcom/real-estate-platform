'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, Home } from 'lucide-react';

const API_BASE = '/api/portal';

interface TransactionEvent {
  event_date: string;
  event_type: string;
  price?: number;
  price_per_sqft?: number;
  appreciation_pct?: number;
  appreciation_amount?: number;
  annualized_appreciation?: number;
  years_held?: number;
}

interface TransactionHistoryData {
  parcel_id: string;
  property_address: string;
  current_value?: number;
  transactions: TransactionEvent[];
  total_appreciation_pct?: number;
  total_appreciation_amount?: number;
}

interface TransactionHistoryProps {
  propertyId: string;
  listingId?: number;
}

export default function TransactionHistory({ propertyId, listingId }: TransactionHistoryProps) {
  const [history, setHistory] = useState<TransactionHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId && !listingId) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try listing_id first (more reliable lookup), then fall back to parcel_id
        const primaryId = listingId ? String(listingId) : propertyId;
        const response = await fetch(
          `${API_BASE}/api/properties/${primaryId}/transaction-history`
        );
        if (response.ok) {
          const data = await response.json();
          // If listing lookup returned empty transactions and we have a parcel_id, try that
          if (data.transactions.length === 0 && listingId && propertyId) {
            const fallbackRes = await fetch(
              `${API_BASE}/api/properties/${propertyId}/transaction-history`
            );
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              if (fallbackData.transactions.length > 0) {
                setHistory(fallbackData);
                return;
              }
            }
          }
          setHistory(data);
        } else {
          setError('Transaction history not available');
        }
      } catch {
        setError('Transaction history not available');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [propertyId, listingId]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  if (loading) {
    return (
      <div className="bg-stone-50 rounded-xl border border-stone-100 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-stone-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-stone-50 border border-stone-100 rounded-xl p-6 text-center">
        <Calendar className="w-8 h-8 text-stone-300 mx-auto mb-2" />
        <p className="text-sm text-stone-500">{error}</p>
      </div>
    );
  }

  if (!history || history.transactions.length === 0) {
    return (
      <div className="bg-stone-50 border border-stone-100 rounded-xl p-6 text-center">
        <Calendar className="w-8 h-8 text-stone-300 mx-auto mb-2" />
        <p className="text-sm text-stone-500">No recorded transactions for this property</p>
      </div>
    );
  }

  // Reverse to show most recent first
  const sortedTransactions = [...history.transactions].reverse();
  const totalEvents = sortedTransactions.length + (history.current_value ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Summary line */}
      <p className="text-xs text-stone-400">
        {totalEvents} {totalEvents === 1 ? 'event' : 'events'} recorded
      </p>

      {/* Timeline */}
      <div className="space-y-0">
        {/* Current Value — always first (most recent) */}
        {history.current_value && (
          <div className="relative pl-7 pb-4">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-4 bottom-0 w-px bg-stone-200" />
            {/* Dot */}
            <div className="absolute left-0 top-1 w-[15px] h-[15px] rounded-full bg-teal-600 border-2 border-white shadow-sm" />
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
                  Current Estimate
                </span>
                <span className="text-xs text-stone-400">Today</span>
              </div>
              <div className="font-serif text-xl font-semibold text-stone-900">
                {formatCurrency(history.current_value)}
              </div>
              {history.total_appreciation_pct != null && history.total_appreciation_amount != null && (
                <div
                  className={`flex items-center gap-1.5 text-xs font-semibold mt-2 ${
                    history.total_appreciation_pct >= 0 ? 'text-teal-700' : 'text-rose-600'
                  }`}
                >
                  {history.total_appreciation_pct >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {history.total_appreciation_pct >= 0 ? '+' : ''}
                    {formatCurrency(history.total_appreciation_amount)} (
                    {history.total_appreciation_pct.toFixed(1)}%) since last sale
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sale Events — most recent first */}
        {sortedTransactions.map((event, index) => {
          const isLast = index === sortedTransactions.length - 1;
          const isGain = event.appreciation_pct != null && event.appreciation_pct > 0;
          const isLoss = event.appreciation_pct != null && event.appreciation_pct < 0;

          return (
            <div
              key={`${event.event_date}-${index}`}
              className={`relative pl-7 ${!isLast ? 'pb-4' : ''}`}
            >
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-[7px] top-4 bottom-0 w-px bg-stone-200" />
              )}
              {/* Dot */}
              <div
                className={`absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-2 border-white shadow-sm ${
                  isGain ? 'bg-teal-500' : isLoss ? 'bg-rose-500' : 'bg-stone-400'
                }`}
              />
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Home className="w-3 h-3" />
                    Sale
                  </span>
                  <span className="text-xs text-stone-400">{formatDate(event.event_date)}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-xl font-semibold text-stone-900">
                    {formatCurrency(event.price || 0)}
                  </span>
                  {event.price_per_sqft && (
                    <span className="text-xs text-stone-400">
                      ${Math.round(event.price_per_sqft)}/sqft
                    </span>
                  )}
                </div>

                {event.appreciation_pct != null && (
                  <div className="mt-2 pt-2 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span
                      className={`flex items-center gap-1 text-xs font-semibold ${
                        event.appreciation_pct >= 0 ? 'text-teal-700' : 'text-rose-600'
                      }`}
                    >
                      {event.appreciation_pct >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {event.appreciation_pct >= 0 ? '+' : ''}
                      {formatCurrency(Math.abs(event.appreciation_amount || 0))} (
                      {Math.abs(event.appreciation_pct).toFixed(1)}%)
                    </span>
                    {event.years_held != null && event.annualized_appreciation != null && (
                      <span className="text-[11px] text-stone-400">
                        {event.years_held.toFixed(1)} yr hold &middot;{' '}
                        {event.annualized_appreciation >= 0 ? '+' : ''}
                        {event.annualized_appreciation.toFixed(1)}%/yr
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
