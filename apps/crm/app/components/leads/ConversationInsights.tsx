'use client';

import { memo, useState, useCallback } from 'react';

interface ExtractedInsight {
  category: 'preference' | 'timeline' | 'budget' | 'concern' | 'requirement' | 'sentiment';
  value: string;
  confidence: number;
}

interface ConversationInsightsProps {
  text: string;
  leadId: string;
  tenantId: string;
  onApplyInsights?: (insights: ExtractedInsight[]) => void;
}

const CATEGORY_LABELS: Record<string, { label: string; glyph: string }> = {
  preference: { label: 'Preference', glyph: '⚙' },
  timeline: { label: 'Timeline', glyph: '⏱' },
  budget: { label: 'Budget', glyph: '$' },
  concern: { label: 'Concern', glyph: '⚠' },
  requirement: { label: 'Requirement', glyph: '✓' },
  sentiment: { label: 'Sentiment', glyph: '◉' },
};

function confidenceLabel(c: number): string {
  if (c >= 0.8) return 'High';
  if (c >= 0.5) return 'Medium';
  return 'Low';
}

export const ConversationInsights = memo(function ConversationInsights({
  text,
  leadId,
  tenantId,
  onApplyInsights,
}: ConversationInsightsProps) {
  const [insights, setInsights] = useState<ExtractedInsight[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [error, setError] = useState('');

  const extractInsights = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/extract-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({ text, leadId }),
      });

      if (!response.ok) {
        setError('Failed to extract insights.');
        return;
      }

      const json = (await response.json()) as {
        ok: boolean;
        result?: { insights: ExtractedInsight[] };
      };

      if (json.ok && json.result?.insights) {
        setInsights(json.result.insights);
        setSelected(new Set(json.result.insights.map((_, i) => i)));
        setExtracted(true);
      } else {
        setError('No insights found.');
      }
    } catch {
      setError('Network error extracting insights.');
    } finally {
      setLoading(false);
    }
  }, [text, leadId, tenantId]);

  const toggleInsight = useCallback((index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleApply = useCallback(() => {
    const selectedInsights = insights.filter((_, i) => selected.has(i));
    onApplyInsights?.(selectedInsights);
  }, [insights, selected, onApplyInsights]);

  if (!extracted) {
    return (
      <div className="crm-insights-trigger">
        <button
          type="button"
          className="crm-btn crm-btn-ghost crm-insights-trigger__btn"
          onClick={() => void extractInsights()}
          disabled={loading || !text.trim()}
        >
          {loading ? (
            <>Extracting...</>
          ) : (
            <>
              <span className="crm-ai-glyph">◆</span> Extract Insights
            </>
          )}
        </button>
        {error && <span className="crm-insights-error">{error}</span>}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="crm-insights-panel">
        <p className="crm-muted">No insights could be extracted from this text.</p>
      </div>
    );
  }

  return (
    <div className="crm-insights-panel">
      <div className="crm-insights-panel__header">
        <span className="crm-ai-glyph">◆</span>
        <span>Extracted Insights</span>
        <span className="crm-muted">({insights.length} found)</span>
      </div>

      <ul className="crm-insights-list">
        {insights.map((insight, i) => {
          const cat = CATEGORY_LABELS[insight.category] || { label: insight.category, glyph: '•' };
          return (
            <li key={i} className="crm-insights-item">
              <label className="crm-insights-item__label">
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleInsight(i)}
                  className="crm-insights-item__check"
                />
                <span className="crm-insights-item__glyph">{cat.glyph}</span>
                <span className="crm-insights-item__content">
                  <span className="crm-insights-item__category">{cat.label}</span>
                  <span className="crm-insights-item__value">{insight.value}</span>
                </span>
                <span className={`crm-insights-item__confidence crm-insights-item__confidence--${confidenceLabel(insight.confidence).toLowerCase()}`}>
                  {confidenceLabel(insight.confidence)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {onApplyInsights && (
        <div className="crm-insights-panel__actions">
          <button
            type="button"
            className="crm-btn crm-btn-ghost"
            onClick={() => { setExtracted(false); setInsights([]); }}
          >
            Dismiss
          </button>
          <button
            type="button"
            className="crm-btn crm-btn-primary"
            disabled={selected.size === 0}
            onClick={handleApply}
          >
            Apply {selected.size} Insight{selected.size !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
});
