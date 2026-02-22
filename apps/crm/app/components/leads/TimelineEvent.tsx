'use client';

export type TimelineEventCategory = 'website' | 'communication' | 'status' | 'note' | 'system';

export interface TimelineEventData {
  id: string;
  category: TimelineEventCategory;
  icon: string;
  label: string;
  summary: string;
  detail?: string;
  occurredAt: string;
}

interface TimelineEventProps {
  event: TimelineEventData;
  formatTime: (iso: string) => string;
}

export function TimelineEvent({ event, formatTime }: TimelineEventProps) {
  return (
    <div className={`crm-timeline-event crm-timeline-event--${event.category}`}>
      <div className="crm-timeline-event-marker" aria-hidden="true">
        <span className="crm-timeline-event-icon">{event.icon}</span>
      </div>
      <div className="crm-timeline-event-body">
        <div className="crm-timeline-event-head">
          <span className="crm-timeline-event-label">{event.label}</span>
          <span className="crm-timeline-event-time">{formatTime(event.occurredAt)}</span>
        </div>
        <p className="crm-timeline-event-summary">{event.summary}</p>
        {event.detail ? (
          <p className="crm-timeline-event-detail">{event.detail}</p>
        ) : null}
      </div>
    </div>
  );
}
