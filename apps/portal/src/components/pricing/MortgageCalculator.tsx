'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Home, TrendingUp, Info } from 'lucide-react';

const API_BASE = '/api/portal';

interface MortgageCalculatorProps {
  defaultHomePrice: number;
  propertyTaxAnnual?: number;
  taxSource?: 'mls' | 'mill-rate';
  hoaMonthly?: number;
}

// ────────────────────────────────────────────────────────
// SVG Donut Chart
// ────────────────────────────────────────────────────────
interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

function PaymentDonut({
  segments,
  total,
  formatCurrency,
}: {
  segments: DonutSegment[];
  total: number;
  formatCurrency: (v: number) => string;
}) {
  const size = 200;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((segment) => {
      const fraction = total > 0 ? segment.value / total : 0;
      const dashLength = fraction * circumference;
      const gap = circumference - dashLength;
      const offset = -cumulativeOffset;
      cumulativeOffset += dashLength;
      return { ...segment, dashLength, gap, offset, fraction };
    });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      {/* Donut SVG */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arc.dashLength} ${arc.gap}`}
              strokeDashoffset={arc.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-stone-400">Monthly</span>
          <span className="font-serif text-2xl font-bold text-stone-900">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 min-w-0 space-y-2">
        {arcs.map((arc) => (
          <div key={arc.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: arc.color }}
              />
              <span className="text-xs text-stone-600 truncate">{arc.label}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-semibold text-stone-900">
                {formatCurrency(arc.value)}
              </span>
              <span className="text-[10px] text-stone-400 w-8 text-right">
                {(arc.fraction * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────
export default function MortgageCalculator({
  defaultHomePrice,
  propertyTaxAnnual = 0,
  taxSource,
  hoaMonthly = 0,
}: MortgageCalculatorProps) {
  const [homePrice, setHomePrice] = useState(defaultHomePrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [downPaymentDollar, setDownPaymentDollar] = useState(defaultHomePrice * 0.2);
  const [interestRate, setInterestRate] = useState(6.875);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [usePercentMode, setUsePercentMode] = useState(true);

  const [homePriceInput, setHomePriceInput] = useState(`${Math.round(defaultHomePrice)}`);
  const [downPaymentPercentInput, setDownPaymentPercentInput] = useState(
    downPaymentPercent.toFixed(1)
  );
  const [downPaymentDollarInput, setDownPaymentDollarInput] = useState(
    `${Math.round(downPaymentDollar)}`
  );
  const [interestRateInput, setInterestRateInput] = useState(interestRate.toFixed(3));
  const [isEditingHomePrice, setIsEditingHomePrice] = useState(false);
  const [isEditingDownPaymentPercent, setIsEditingDownPaymentPercent] = useState(false);
  const [isEditingDownPaymentDollar, setIsEditingDownPaymentDollar] = useState(false);
  const [isEditingRate, setIsEditingRate] = useState(false);

  const [ratesLoading, setRatesLoading] = useState(true);
  const [calculationLoading, setCalculationLoading] = useState(false);

  const [breakdown, setBreakdown] = useState<{
    principal_and_interest: number;
    property_tax_monthly: number;
    homeowners_insurance_monthly: number;
    hoa_monthly: number;
    pmi_monthly: number;
    total_monthly_payment: number;
    loan_amount: number;
    down_payment_amount: number;
  } | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/mortgage/rates/current`);
        if (response.ok) {
          const data = await response.json();
          setInterestRate(data.rate_30yr);
        }
      } catch {
        // use default rate
      } finally {
        setRatesLoading(false);
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    const calculatePayment = async () => {
      setCalculationLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/mortgage/calculate-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            home_price: homePrice,
            down_payment: downPaymentPercent,
            interest_rate: interestRate,
            loan_term_years: loanTermYears,
            property_tax_annual: propertyTaxAnnual,
            hoa_monthly: hoaMonthly,
          }),
        });
        if (response.ok) setBreakdown(await response.json());
      } catch {
        // calculation failed silently
      } finally {
        setCalculationLoading(false);
      }
    };
    calculatePayment();
  }, [homePrice, downPaymentPercent, interestRate, loanTermYears, propertyTaxAnnual, hoaMonthly]);

  useEffect(() => {
    if (usePercentMode) {
      setDownPaymentDollar(homePrice * (downPaymentPercent / 100));
    } else {
      setDownPaymentPercent((downPaymentDollar / homePrice) * 100);
    }
  }, [homePrice, downPaymentPercent, downPaymentDollar, usePercentMode]);

  useEffect(() => {
    if (!isEditingHomePrice) setHomePriceInput(`${Math.round(homePrice)}`);
  }, [homePrice, isEditingHomePrice]);

  useEffect(() => {
    if (!isEditingDownPaymentPercent)
      setDownPaymentPercentInput(downPaymentPercent.toFixed(1));
  }, [downPaymentPercent, isEditingDownPaymentPercent]);

  useEffect(() => {
    if (!isEditingDownPaymentDollar)
      setDownPaymentDollarInput(`${Math.round(downPaymentDollar)}`);
  }, [downPaymentDollar, isEditingDownPaymentDollar]);

  useEffect(() => {
    if (!isEditingRate) setInterestRateInput(interestRate.toFixed(3));
  }, [interestRate, isEditingRate]);

  const clampValue = (value: number, min: number, max: number) => {
    if (Number.isNaN(value)) return min;
    return Math.min(Math.max(value, min), max);
  };

  const commitHomePriceInput = () => {
    const min = Math.floor(defaultHomePrice * 0.5);
    const max = Math.ceil(defaultHomePrice * 1.5);
    const parsed = Number(homePriceInput);
    if (!Number.isNaN(parsed)) setHomePrice(clampValue(parsed, min, max));
    setIsEditingHomePrice(false);
  };

  const commitDownPaymentPercentInput = () => {
    const parsed = Number(downPaymentPercentInput);
    if (!Number.isNaN(parsed)) {
      setUsePercentMode(true);
      setDownPaymentPercent(clampValue(parsed, 0, 50));
    }
    setIsEditingDownPaymentPercent(false);
  };

  const commitDownPaymentDollarInput = () => {
    const parsed = Number(downPaymentDollarInput);
    if (!Number.isNaN(parsed)) {
      setUsePercentMode(false);
      setDownPaymentDollar(clampValue(parsed, 0, homePrice * 0.5));
    }
    setIsEditingDownPaymentDollar(false);
  };

  const commitInterestRateInput = () => {
    const parsed = Number(interestRateInput);
    if (!Number.isNaN(parsed)) setInterestRate(clampValue(parsed, 3.0, 10.0));
    setIsEditingRate(false);
  };

  const handleDownPaymentPercentChange = (value: number) => {
    setUsePercentMode(true);
    setDownPaymentPercent(value);
  };

  const handleDownPaymentDollarChange = (value: number) => {
    setUsePercentMode(false);
    setDownPaymentDollar(value);
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const homePriceMin = Math.floor(defaultHomePrice * 0.5);
  const homePriceMax = Math.ceil(defaultHomePrice * 1.5);

  // Build donut segments from breakdown
  const donutSegments: DonutSegment[] = breakdown
    ? [
        { label: 'Principal & Interest', value: breakdown.principal_and_interest, color: '#57534e' },
        { label: 'Property Tax', value: breakdown.property_tax_monthly, color: '#0f766e' },
        { label: 'Insurance', value: breakdown.homeowners_insurance_monthly, color: '#d97706' },
        { label: 'HOA', value: breakdown.hoa_monthly, color: '#a8a29e' },
        { label: 'PMI', value: breakdown.pmi_monthly, color: '#e11d48' },
      ]
    : [];

  return (
    <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-teal-700 p-2 rounded-lg">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-semibold text-stone-900">Mortgage Calculator</h3>
          <p className="text-xs text-stone-500">
            {ratesLoading ? 'Loading current rates...' : 'Current rates updated today'}
          </p>
        </div>
      </div>

      {/* Input Controls */}
      <div className="space-y-5 mb-6">
        {/* Home Price */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-stone-700">Home Price</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-500">$</span>
              <input
                type="number"
                min={homePriceMin}
                max={homePriceMax}
                step={1000}
                value={homePriceInput}
                onFocus={() => setIsEditingHomePrice(true)}
                onChange={(e) => setHomePriceInput(e.target.value)}
                onBlur={commitHomePriceInput}
                onKeyDown={(e) => { if (e.key === 'Enter') commitHomePriceInput(); }}
                className="w-28 text-right text-lg font-bold text-stone-900 bg-transparent border-b border-stone-300 focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>
          <input
            type="range"
            min={homePriceMin}
            max={homePriceMax}
            step={1000}
            value={homePrice}
            onChange={(e) => setHomePrice(Number(e.target.value))}
            className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
          />
        </div>

        {/* Down Payment */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-stone-700">Down Payment</label>
            <div className="flex items-center gap-2">
              {usePercentMode ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    step={0.1}
                    value={downPaymentPercentInput}
                    onFocus={() => setIsEditingDownPaymentPercent(true)}
                    onChange={(e) => setDownPaymentPercentInput(e.target.value)}
                    onBlur={commitDownPaymentPercentInput}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitDownPaymentPercentInput(); }}
                    className="w-20 text-right text-lg font-bold text-stone-900 bg-transparent border-b border-stone-300 focus:border-teal-600 focus:outline-none"
                  />
                  <span className="text-lg font-bold text-stone-900">%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-stone-500">$</span>
                  <input
                    type="number"
                    min={0}
                    max={homePrice * 0.5}
                    step={1000}
                    value={downPaymentDollarInput}
                    onFocus={() => setIsEditingDownPaymentDollar(true)}
                    onChange={(e) => setDownPaymentDollarInput(e.target.value)}
                    onBlur={commitDownPaymentDollarInput}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitDownPaymentDollarInput(); }}
                    className="w-28 text-right text-lg font-bold text-stone-900 bg-transparent border-b border-stone-300 focus:border-teal-600 focus:outline-none"
                  />
                </div>
              )}
              <button
                onClick={() => setUsePercentMode(!usePercentMode)}
                className="text-xs bg-stone-200 hover:bg-stone-300 px-2 py-1 rounded text-stone-600 transition-colors"
              >
                {usePercentMode ? '%' : '$'}
              </button>
            </div>
          </div>
          {usePercentMode ? (
            <input
              type="range"
              min={0}
              max={50}
              step={0.5}
              value={downPaymentPercent}
              onChange={(e) => handleDownPaymentPercentChange(Number(e.target.value))}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
            />
          ) : (
            <input
              type="range"
              min={0}
              max={homePrice * 0.5}
              step={1000}
              value={downPaymentDollar}
              onChange={(e) => handleDownPaymentDollarChange(Number(e.target.value))}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
            />
          )}
        </div>

        {/* Interest Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-stone-700">Interest Rate</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={3.0}
                max={10.0}
                step={0.125}
                value={interestRateInput}
                onFocus={() => setIsEditingRate(true)}
                onChange={(e) => setInterestRateInput(e.target.value)}
                onBlur={commitInterestRateInput}
                onKeyDown={(e) => { if (e.key === 'Enter') commitInterestRateInput(); }}
                className="w-24 text-right text-lg font-bold text-stone-900 bg-transparent border-b border-stone-300 focus:border-teal-600 focus:outline-none"
              />
              <span className="text-lg font-bold text-stone-900">%</span>
            </div>
          </div>
          <input
            type="range"
            min={3.0}
            max={10.0}
            step={0.125}
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
          />
        </div>

        {/* Loan Term */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-stone-700">Loan Term</label>
            <span className="text-lg font-bold text-stone-900">{loanTermYears} years</span>
          </div>
          <div className="flex gap-2">
            {[15, 20, 30].map((term) => (
              <button
                key={term}
                onClick={() => setLoanTermYears(term)}
                className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-colors ${
                  loanTermYears === term
                    ? 'bg-teal-700 text-white'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                {term}yr
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      {breakdown && !calculationLoading ? (
        <div className="bg-white rounded-xl p-5 border border-stone-100">
          <h4 className="text-base font-semibold text-stone-900 mb-5 flex items-center gap-2">
            <Home className="w-5 h-5" />
            Monthly Payment Breakdown
          </h4>

          {/* Donut Chart */}
          <PaymentDonut
            segments={donutSegments}
            total={breakdown.total_monthly_payment}
            formatCurrency={formatCurrency}
          />

          {/* Tax source note */}
          {breakdown.property_tax_monthly > 0 && taxSource && (
            <div className="mt-4 flex items-start gap-2 text-[11px] text-stone-400">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>
                Property tax:{' '}
                {taxSource === 'mls'
                  ? 'From MLS listing data'
                  : 'Estimated from CT mill rates & assessed value'}
              </span>
            </div>
          )}
          {breakdown.property_tax_monthly === 0 && (
            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Property tax data is not available for this property. The payment estimate above does not include property taxes.
              </p>
            </div>
          )}

          {/* Loan Details */}
          <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-500 space-y-1">
            <div className="flex justify-between">
              <span>Loan Amount</span>
              <span className="font-semibold">{formatCurrency(breakdown.loan_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Down Payment</span>
              <span className="font-semibold">{formatCurrency(breakdown.down_payment_amount)}</span>
            </div>
            {propertyTaxAnnual > 0 && (
              <div className="flex justify-between">
                <span>
                  Annual Tax{taxSource === 'mill-rate' ? ' (Est.)' : ''}
                </span>
                <span className="font-semibold">{formatCurrency(propertyTaxAnnual)}</span>
              </div>
            )}
          </div>

          {/* Income Guidance */}
          <div className="mt-4 bg-teal-50 border border-teal-100 rounded-lg p-3 flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-teal-800">
              <span className="font-semibold">Suggested income:</span>{' '}
              {formatCurrency((breakdown.total_monthly_payment / 0.28) * 12)} / year
              <span className="text-teal-600"> (28% housing budget guideline)</span>
            </p>
          </div>

          {breakdown.pmi_monthly > 0 && (
            <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                <span className="font-semibold">Tip:</span> Increase your down payment to 20% to
                eliminate PMI and save {formatCurrency(breakdown.pmi_monthly * 12)}/year
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-5 border border-stone-100 flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-stone-300 border-t-teal-700" />
        </div>
      )}
    </div>
  );
}
