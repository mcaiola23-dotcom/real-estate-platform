'use client';

import { useState, useCallback, useRef } from 'react';

interface PriceRangeSliderProps {
  minValue: number;
  maxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
}

// ── Piecewise scale ──
// 0–80% of the track = $0–$5M (linear, $25K steps)
// 80–100% of the track = $5M–$10M (compressed, $100K steps)
// At 100% the value = 10_000_000 and displays as "$10M+"

const VALUE_MAX = 10_000_000;
const BREAK_PCT = 0.8;          // 80% of track
const BREAK_VAL = 5_000_000;    // $5M breakpoint
const STEP_LO = 25_000;         // $25K steps for $0–$5M
const STEP_HI = 100_000;        // $100K steps for $5M–$10M

function valueToPercent(v: number): number {
  const clamped = Math.max(0, Math.min(v, VALUE_MAX));
  if (clamped <= BREAK_VAL) {
    return (clamped / BREAK_VAL) * BREAK_PCT * 100;
  }
  return (BREAK_PCT + ((clamped - BREAK_VAL) / (VALUE_MAX - BREAK_VAL)) * (1 - BREAK_PCT)) * 100;
}

function percentToValue(pct: number): number {
  const ratio = Math.max(0, Math.min(pct / 100, 1));
  if (ratio <= BREAK_PCT) {
    return (ratio / BREAK_PCT) * BREAK_VAL;
  }
  return BREAK_VAL + ((ratio - BREAK_PCT) / (1 - BREAK_PCT)) * (VALUE_MAX - BREAK_VAL);
}

function snapValue(v: number): number {
  if (v <= BREAK_VAL) {
    return Math.round(v / STEP_LO) * STEP_LO;
  }
  return Math.round(v / STEP_HI) * STEP_HI;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(v, hi));
}

function formatCompact(value: number): string {
  if (value >= VALUE_MAX) return '$10M+';
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2).replace(/0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `$${Math.round(value / 1_000).toLocaleString()}K`;
  }
  return `$${value.toLocaleString()}`;
}

function formatWithCommas(value: number): string {
  return value.toLocaleString('en-US');
}

// Scale markers with positions computed from the piecewise mapping
const SCALE_MARKS = [
  { value: 0, label: '$0' },
  { value: 1_000_000, label: '$1M' },
  { value: 2_500_000, label: '$2.5M' },
  { value: 5_000_000, label: '$5M' },
  { value: 10_000_000, label: '$10M+' },
];

export function PriceRangeSlider({ minValue, maxValue, onMinChange, onMaxChange }: PriceRangeSliderProps) {
  const [editingMin, setEditingMin] = useState(false);
  const [editingMax, setEditingMax] = useState(false);
  const [editMinText, setEditMinText] = useState('');
  const [editMaxText, setEditMaxText] = useState('');
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const safeMin = clamp(Math.min(minValue || 0, maxValue || 0), 0, VALUE_MAX);
  const safeMax = clamp(Math.max(minValue || 0, maxValue || 0), 0, VALUE_MAX);

  const minPct = valueToPercent(safeMin);
  const maxPct = valueToPercent(safeMax);

  const posToValue = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const pct = clamp((clientX - rect.left) / rect.width, 0, 1) * 100;
    return snapValue(percentToValue(pct));
  }, []);

  const handlePointerDown = useCallback((thumb: 'min' | 'max') => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(thumb);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const val = posToValue(e.clientX);
    if (dragging === 'min') {
      onMinChange(Math.min(val, safeMax));
    } else {
      onMaxChange(Math.max(val, safeMin));
    }
  }, [dragging, posToValue, onMinChange, onMaxChange, safeMin, safeMax]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (dragging) return;
    if ((e.target as HTMLElement).classList.contains('crm-price-slider__thumb')) return;
    const val = posToValue(e.clientX);
    const distToMin = Math.abs(val - safeMin);
    const distToMax = Math.abs(val - safeMax);
    if (distToMin <= distToMax) {
      onMinChange(Math.min(val, safeMax));
    } else {
      onMaxChange(Math.max(val, safeMin));
    }
  }, [dragging, posToValue, safeMin, safeMax, onMinChange, onMaxChange]);

  const commitMinEdit = () => {
    const parsed = Number(editMinText.replace(/[^0-9]/g, ''));
    if (Number.isFinite(parsed) && parsed >= 0) {
      onMinChange(snapValue(clamp(Math.min(parsed, safeMax), 0, VALUE_MAX)));
    }
    setEditingMin(false);
  };

  const commitMaxEdit = () => {
    const parsed = Number(editMaxText.replace(/[^0-9]/g, ''));
    if (Number.isFinite(parsed) && parsed >= 0) {
      onMaxChange(snapValue(clamp(Math.max(parsed, safeMin), 0, VALUE_MAX)));
    }
    setEditingMax(false);
  };

  const bothZero = safeMin === 0 && safeMax === 0;

  return (
    <div className="crm-price-slider">
      {/* Track with two draggable thumbs */}
      <div
        className="crm-price-slider__track-wrapper"
        ref={trackRef}
        onClick={handleTrackClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="crm-price-slider__track-bg" />
        <div
          className="crm-price-slider__track-fill"
          style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
        />
        {/* Min thumb */}
        <div
          className={`crm-price-slider__thumb crm-price-slider__thumb--min ${dragging === 'min' ? 'crm-price-slider__thumb--active' : ''}`}
          style={{ left: `${minPct}%` }}
          onPointerDown={handlePointerDown('min')}
          role="slider"
          aria-label="Minimum price"
          aria-valuemin={0}
          aria-valuemax={VALUE_MAX}
          aria-valuenow={safeMin}
          tabIndex={0}
        />
        {/* Max thumb */}
        <div
          className={`crm-price-slider__thumb crm-price-slider__thumb--max ${dragging === 'max' ? 'crm-price-slider__thumb--active' : ''}`}
          style={{ left: `${maxPct}%` }}
          onPointerDown={handlePointerDown('max')}
          role="slider"
          aria-label="Maximum price"
          aria-valuemin={0}
          aria-valuemax={VALUE_MAX}
          aria-valuenow={safeMax}
          tabIndex={0}
        />
      </div>

      {/* Scale markers — positioned via the piecewise mapping */}
      <div className="crm-price-slider__scale">
        {SCALE_MARKS.map((mark) => (
          <span
            key={mark.value}
            className="crm-price-slider__scale-mark"
            style={{ left: `${valueToPercent(mark.value)}%` }}
          >
            {mark.label}
          </span>
        ))}
      </div>

      {/* Value displays — below the slider */}
      <div className="crm-price-slider__values">
        <div className="crm-price-slider__value-group">
          <span className="crm-price-slider__value-label">Min</span>
          {editingMin ? (
            <div className="crm-price-slider__edit-wrap">
              <span className="crm-price-slider__edit-prefix">$</span>
              <input
                className="crm-price-slider__edit-input"
                type="text"
                inputMode="numeric"
                autoFocus
                value={editMinText}
                onChange={(e) => setEditMinText(e.target.value)}
                onBlur={commitMinEdit}
                onKeyDown={(e) => e.key === 'Enter' && commitMinEdit()}
                placeholder="0"
              />
            </div>
          ) : (
            <button
              type="button"
              className="crm-price-slider__value-btn"
              onClick={() => { setEditMinText(formatWithCommas(safeMin)); setEditingMin(true); }}
              title="Click to type a value"
            >
              {bothZero ? '$0' : formatCompact(safeMin)}
            </button>
          )}
        </div>
        <span className="crm-price-slider__range-sep" aria-hidden="true">—</span>
        <div className="crm-price-slider__value-group">
          <span className="crm-price-slider__value-label">Max</span>
          {editingMax ? (
            <div className="crm-price-slider__edit-wrap">
              <span className="crm-price-slider__edit-prefix">$</span>
              <input
                className="crm-price-slider__edit-input"
                type="text"
                inputMode="numeric"
                autoFocus
                value={editMaxText}
                onChange={(e) => setEditMaxText(e.target.value)}
                onBlur={commitMaxEdit}
                onKeyDown={(e) => e.key === 'Enter' && commitMaxEdit()}
                placeholder="0"
              />
            </div>
          ) : (
            <button
              type="button"
              className="crm-price-slider__value-btn"
              onClick={() => { setEditMaxText(formatWithCommas(safeMax)); setEditingMax(true); }}
              title="Click to type a value"
            >
              {bothZero ? '$0' : formatCompact(safeMax)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
