import { memo } from 'react';
import type { CrmLeadStatus } from '@real-estate/types/crm';

export const StatusIcon = memo(function StatusIcon({ status, size = 16 }: { status: CrmLeadStatus; size?: number }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true as const };
  switch (status) {
    case 'new':
      return (
        <svg {...props}>
          <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4l-6.4 4.8L8 14l-6-4.8h7.6z" fill="var(--status-new)" />
        </svg>
      );
    case 'qualified':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" stroke="var(--status-qualified)" strokeWidth="2" />
          <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="var(--status-qualified)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'nurturing':
      return (
        <svg {...props}>
          <path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5A8.5 8.5 0 0121 11v.5z" stroke="var(--status-nurturing)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'won':
      return (
        <svg {...props}>
          <path d="M6 9V3h12v6" stroke="var(--status-won)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 9a6 6 0 006 6 6 6 0 006-6" stroke="var(--status-won)" strokeWidth="2" />
          <path d="M12 15v3M8 21h8M10 18h4" stroke="var(--status-won)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'lost':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--status-lost)" strokeWidth="2" />
          <path d="M8 12h8" stroke="var(--status-lost)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" fill="var(--crm-muted)" />
        </svg>
      );
  }
});
