'use client';

import { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

const API_BASE = '/api/portal';

interface AvmHistoryPoint {
  valuation_date: string;
  estimated_value: number;
  confidence_score: number;
}

interface AvmHistoryData {
  parcel_id: string;
  valuations: AvmHistoryPoint[];
}

interface AVMHistoryChartProps {
  parcelId: string;
  months?: number;
  className?: string;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AVMHistoryChart({
  parcelId,
  months: initialMonths = 12,
  className = '',
}: AVMHistoryChartProps) {
  const [data, setData] = useState<AvmHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(initialMonths);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const encoded = encodeURIComponent(parcelId);
        const response = await fetch(`${API_BASE}/api/avm/history/${encoded}?months=${months}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('No valuation history available for this property');
          } else {
            throw new Error('Failed to fetch AVM history');
          }
          return;
        }
        setData(await response.json());
      } catch {
        setError('Unable to load value history');
      } finally {
        setLoading(false);
      }
    };

    if (parcelId) fetchHistory();
  }, [parcelId, months]);

  const getTrend = () => {
    if (!data?.valuations || data.valuations.length < 2) return null;
    const sorted = [...data.valuations].sort(
      (a, b) => new Date(a.valuation_date).getTime() - new Date(b.valuation_date).getTime()
    );
    const oldest = sorted[0].estimated_value;
    const newest = sorted[sorted.length - 1].estimated_value;
    const change = newest - oldest;
    const percentChange = parseFloat(((change / oldest) * 100).toFixed(1));
    return {
      change,
      percentChange,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : ('flat' as const),
    };
  };

  const trend = getTrend();

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl border border-stone-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="h-5 w-5 text-stone-400 animate-spin" />
          <span className="ml-2 text-stone-500 text-sm">Loading value history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-stone-50 rounded-2xl border border-stone-200 p-6 text-center ${className}`}>
        <p className="text-stone-500 text-sm">{error}</p>
      </div>
    );
  }

  if (!data?.valuations || data.valuations.length === 0) {
    return (
      <div className={`bg-stone-50 rounded-2xl border border-stone-200 p-6 text-center ${className}`}>
        <p className="text-stone-500 text-sm">No valuation history available yet</p>
      </div>
    );
  }

  const chartData = [...data.valuations]
    .sort((a, b) => new Date(a.valuation_date).getTime() - new Date(b.valuation_date).getTime())
    .map((point) => ({
      date: formatDate(point.valuation_date),
      fullDate: formatFullDate(point.valuation_date),
      value: point.estimated_value,
      confidence: point.confidence_score,
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    return (
      <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-3">
        <p className="text-xs text-stone-500 mb-1">{item.fullDate}</p>
        <p className="text-base font-serif font-semibold text-stone-900">
          {formatCurrency(item.value)}
        </p>
        <p className="text-xs text-stone-400">
          Confidence: {(item.confidence * 100).toFixed(0)}%
        </p>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-2xl border border-stone-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-stone-900">Value History</h3>

        <div className="flex items-center gap-3">
          {trend && (
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                trend.direction === 'up'
                  ? 'bg-teal-50 text-teal-700'
                  : trend.direction === 'down'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-stone-50 text-stone-600'
              }`}
            >
              {trend.direction === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
              {trend.direction === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
              {trend.direction === 'flat' && <Minus className="h-3.5 w-3.5" />}
              <span>
                {trend.direction === 'up' ? '+' : ''}
                {trend.percentChange}%
              </span>
            </div>
          )}

          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="bg-stone-50 border border-stone-200 text-stone-700 text-xs rounded-lg focus:ring-teal-500 focus:border-teal-500 p-1.5"
          >
            <option value={12}>1 Year</option>
            <option value={24}>2 Years</option>
            <option value={60}>5 Years</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="tealValueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#78716c' }}
              tickLine={false}
              axisLine={{ stroke: '#e7e5e4' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#78716c' }}
              tickFormatter={(value) => formatCurrency(value)}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#0d9488"
              strokeWidth={2}
              fill="url(#tealValueGradient)"
              dot={{ r: 3.5, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 5, fill: '#0f766e', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-stone-400 mt-4 text-center">
        Automated Valuation Model (AVM) estimates based on comparable sales, market trends, and
        property characteristics
      </p>
    </div>
  );
}
