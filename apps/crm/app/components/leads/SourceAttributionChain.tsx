'use client';

import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import type { CrmActivity } from '@real-estate/types/crm';
import { formatLeadSourceLabel } from '../../lib/crm-display';

interface SourceAttributionChainProps {
  source: string;
  activities: CrmActivity[];
  onNodeClick?: (node: ChainNode, activities: CrmActivity[]) => void;
}

// Approximate width per node (icon + label + gap) in pixels
const NODE_WIDTH_PX = 72;

function activityToTouchpoint(activityType: string): string | null {
  switch (activityType) {
    case 'website_search_performed': return 'Search';
    case 'website_listing_viewed': return 'Listing View';
    case 'website_listing_favorited': return 'Favorited';
    case 'website_listing_unfavorited': return 'Unfavorited';
    case 'lead_submitted': return 'Inquiry';
    case 'valuation_requested': return 'Valuation';
    case 'call_logged': return 'Call';
    case 'text_logged': return 'Text';
    case 'email_logged': return 'Email';
    case 'note': return 'Note';
    case 'lead_status_changed': return 'Status Change';
    default: return null;
  }
}

interface ChainNode {
  label: string;
  count: number;
  isSource: boolean;
}

export { type ChainNode };

// ── Icon map ──

function NodeIcon({ label, isSource }: { label: string; isSource: boolean }) {
  if (isSource) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="2" fill="currentColor" />
      </svg>
    );
  }
  switch (label) {
    case 'Search':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'Listing View':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case 'Favorited':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 3C6.5 1.5 4 1.5 3 3s0 4 5 7c5-3 6-5.5 5-7s-3.5-1.5-5 0z" fill="currentColor" opacity="0.8" />
        </svg>
      );
    case 'Unfavorited':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 3C6.5 1.5 4 1.5 3 3s0 4 5 7c5-3 6-5.5 5-7s-3.5-1.5-5 0z" stroke="currentColor" strokeWidth="1.3" fill="none" />
          <path d="M3 13L13 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'Call':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3.5 2.5c-.5 0-1 .5-1 1 0 5.5 4.5 10 10 10 .5 0 1-.5 1-1v-2l-2.5-1-1.5 1.5c-2-1-3.5-2.5-4.5-4.5L6.5 5l-1-2.5h-2z" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case 'Email':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2 5l6 4 6-4" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case 'Text':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M6 14l2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'Note':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5.5 5h5M5.5 8h5M5.5 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'Status Change':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4-4 4 4M4 10l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'Inquiry':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M6 7h4M8 7v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'Valuation':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M2 13V6l3-2 3 4 3-5 3 2v8H2z" stroke="currentColor" strokeWidth="1.3" fill="none" />
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
  }
}

// ── Helper: format activity date ──

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text;
}

// ── Component ──

export function SourceAttributionChain({ source, activities, onNodeClick }: SourceAttributionChainProps) {
  const [expandedNode, setExpandedNode] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [maxVisible, setMaxVisible] = useState(10);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const chain = useMemo(() => {
    const nodes: ChainNode[] = [];

    // First node: the lead source
    nodes.push({
      label: formatLeadSourceLabel(source),
      count: 1,
      isSource: true,
    });

    // Sort activities chronologically (oldest first)
    const sorted = [...activities].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
    );

    for (const activity of sorted) {
      const touchpoint = activityToTouchpoint(activity.activityType);
      if (!touchpoint) continue;

      const last = nodes[nodes.length - 1];
      if (last && !last.isSource && last.label === touchpoint) {
        last.count += 1;
      } else {
        nodes.push({ label: touchpoint, count: 1, isSource: false });
      }
    }

    return nodes;
  }, [source, activities]);

  // Measure container and compute how many nodes fit in one row
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const width = el.clientWidth;
      // Reserve ~40px for the overflow badge if needed, plus source node always shows
      const availableWidth = width - 40;
      const slots = Math.max(2, Math.floor(availableWidth / NODE_WIDTH_PX));
      setMaxVisible(slots);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getRelatedActivities = useCallback((node: ChainNode) => {
    return activities.filter((a) => activityToTouchpoint(a.activityType) === node.label);
  }, [activities]);

  const handleNodeMouseEnter = useCallback((idx: number, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredNode(idx);
      setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
    }, 300);
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    clearTimeout(hoverTimeoutRef.current);
    setHoveredNode(null);
    setTooltipPos(null);
  }, []);

  const handleNodeClick = useCallback((idx: number, node: ChainNode) => {
    if (node.isSource) return;

    // Toggle expansion
    setExpandedNode((prev) => prev === idx ? null : idx);

    // Fire external handler
    if (onNodeClick) {
      onNodeClick(node, getRelatedActivities(node));
    }
  }, [onNodeClick, getRelatedActivities]);

  if (chain.length <= 1) return null;

  // Show source (first) + the N most recent nodes (from the end)
  // If chain fits, show all. Otherwise show source + most recent + overflow count.
  let visible: ChainNode[];
  let skippedCount = 0;

  if (chain.length <= maxVisible) {
    visible = chain;
  } else {
    // Always show source node (index 0)
    // Then show the (maxVisible - 1) most recent nodes from the end
    const recentSlots = maxVisible - 1; // minus 1 for source node
    const recentNodes = chain.slice(chain.length - recentSlots);
    skippedCount = chain.length - 1 - recentSlots; // how many middle nodes are hidden
    visible = [chain[0]!, ...recentNodes];
  }

  // Map visible indices back to chain indices for tooltip/expansion
  const visibleIndices: number[] = [];
  if (chain.length <= maxVisible) {
    for (let i = 0; i < chain.length; i++) visibleIndices.push(i);
  } else {
    visibleIndices.push(0); // source
    const recentSlots = maxVisible - 1;
    const startIdx = chain.length - recentSlots;
    for (let i = startIdx; i < chain.length; i++) visibleIndices.push(i);
  }

  // Activities for the expanded node
  const expandedActivities = expandedNode !== null ? getRelatedActivities(chain[expandedNode]!) : [];

  // Tooltip data
  const tooltipNode = hoveredNode !== null && hoveredNode >= 0 ? chain[hoveredNode] : null;
  const tooltipActivities = tooltipNode && !tooltipNode.isSource
    ? getRelatedActivities(tooltipNode).slice(0, 3)
    : [];

  // Skipped node labels for overflow tooltip
  const skippedLabels = skippedCount > 0
    ? chain.slice(1, 1 + skippedCount).map((n) => n.label)
    : [];

  return (
    <div className="crm-attribution-chain-wrapper" ref={containerRef}>
      <div className="crm-attribution-chain" aria-label="Lead attribution path">
        <span className="crm-attribution-line" aria-hidden="true" />
        {visible.map((node, vi) => {
          const chainIdx = visibleIndices[vi]!;
          // Insert overflow badge after source node (vi === 0) when there are skipped nodes
          const showOverflowAfter = vi === 0 && skippedCount > 0;
          return (
            <span key={`wrap-${chainIdx}`} style={{ display: 'contents' }}>
              <span
                className={`crm-attribution-stop ${!node.isSource ? 'crm-attribution-node-clickable' : ''} ${expandedNode === chainIdx ? 'crm-attribution-stop--active' : ''}`}
                onClick={() => handleNodeClick(chainIdx, node)}
                onMouseEnter={(e) => handleNodeMouseEnter(chainIdx, e)}
                onMouseLeave={handleNodeMouseLeave}
                role={!node.isSource ? 'button' : undefined}
                tabIndex={!node.isSource ? 0 : undefined}
                onKeyDown={(e) => {
                  if (!node.isSource && e.key === 'Enter') {
                    handleNodeClick(chainIdx, node);
                  }
                }}
              >
                <span
                  className={`crm-attribution-marker ${node.isSource ? 'crm-attribution-marker--origin' : ''}`}
                  aria-hidden="true"
                >
                  <NodeIcon label={node.label} isSource={node.isSource} />
                </span>
                <span className={`crm-attribution-label ${node.isSource ? 'crm-attribution-label--origin' : ''}`}>
                  {node.label}
                  {node.count > 1 && (
                    <span className="crm-attribution-count">{node.count}</span>
                  )}
                </span>
              </span>
              {showOverflowAfter && (
                <span
                  className="crm-attribution-overflow"
                  onMouseEnter={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                    setHoveredNode(-1);
                  }}
                  onMouseLeave={() => {
                    setHoveredNode(null);
                    setTooltipPos(null);
                  }}
                >
                  +{skippedCount}
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Hover tooltip */}
      {hoveredNode !== null && tooltipPos && (
        <div
          className="crm-attribution-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y - 8}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {hoveredNode === -1 ? (
            // Overflow tooltip
            <div className="crm-attribution-tooltip__content">
              <div className="crm-attribution-tooltip__title">{skippedCount} earlier events</div>
              {skippedLabels.map((label, i) => (
                <div key={i} className="crm-attribution-tooltip__row">{label}</div>
              ))}
            </div>
          ) : tooltipNode ? (
            <div className="crm-attribution-tooltip__content">
              <div className="crm-attribution-tooltip__title">
                {tooltipNode.label} {tooltipNode.count > 1 ? `(${tooltipNode.count})` : ''}
              </div>
              {tooltipActivities.map((a) => (
                <div
                  key={a.id}
                  className="crm-attribution-tooltip__row crm-attribution-tooltip__row--clickable"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNodeClick) onNodeClick(tooltipNode, [a]);
                  }}
                >
                  <span className="crm-attribution-tooltip__date">{formatShortDate(a.occurredAt)}</span>
                  <span className="crm-attribution-tooltip__summary">{truncate(a.summary, 40)}</span>
                </div>
              ))}
              {!tooltipNode.isSource && tooltipActivities.length === 0 && (
                <div className="crm-attribution-tooltip__row">No activity details</div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Expansion detail panel */}
      {expandedNode !== null && expandedActivities.length > 0 && (
        <div className="crm-attribution-detail-panel">
          <div className="crm-attribution-detail-panel__header">
            <span>{chain[expandedNode]!.label} — {expandedActivities.length} activit{expandedActivities.length === 1 ? 'y' : 'ies'}</span>
            <button
              type="button"
              className="crm-attribution-detail-panel__close"
              onClick={() => setExpandedNode(null)}
              aria-label="Close detail panel"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="crm-attribution-detail-panel__list">
            {expandedActivities.map((a) => (
              <div key={a.id} className="crm-attribution-detail-panel__item">
                <span className="crm-attribution-detail-panel__date">{formatShortDate(a.occurredAt)}</span>
                <span className="crm-attribution-detail-panel__summary">{a.summary}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
