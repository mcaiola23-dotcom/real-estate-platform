import type { CrmLeadStatus } from '@real-estate/types/crm';

import { formatLeadStatusLabel } from './crm-display';

export type WorkspaceNav = 'dashboard' | 'pipeline' | 'leads' | 'properties' | 'transactions' | 'contacts' | 'activity' | 'analytics' | 'settings' | 'profile';
export type WorkspaceView = 'dashboard' | 'pipeline' | 'leads' | 'properties' | 'transactions' | 'analytics' | 'settings' | 'profile';
export type TableStatusPreset = 'all' | 'new' | 'follow_up' | 'open_pipeline' | 'closed';

export type LeadsTableSortColumn =
  | 'name'
  | 'leadType'
  | 'status'
  | 'score'
  | 'priceRange'
  | 'location'
  | 'lastContact'
  | 'desired'
  | 'source'
  | 'updatedAt'
  | 'phone'
  | 'email';

export interface LeadsTableSort {
  column: LeadsTableSortColumn;
  direction: 'asc' | 'desc';
}

export function resolveViewFromNav(nav: WorkspaceNav): WorkspaceView {
  if (nav === 'pipeline') {
    return 'pipeline';
  }
  if (nav === 'leads') {
    return 'leads';
  }
  if (nav === 'properties') {
    return 'properties';
  }
  if (nav === 'transactions') {
    return 'transactions';
  }
  if (nav === 'settings') {
    return 'settings';
  }
  if (nav === 'profile') {
    return 'profile';
  }
  if (nav === 'analytics') {
    return 'analytics';
  }
  return 'dashboard';
}

export function doesStatusMatchPreset(status: CrmLeadStatus, preset: TableStatusPreset): boolean {
  if (preset === 'all') {
    return true;
  }
  if (preset === 'new') {
    return status === 'new';
  }
  if (preset === 'follow_up') {
    return status === 'qualified' || status === 'nurturing';
  }
  if (preset === 'open_pipeline') {
    return status === 'new' || status === 'qualified' || status === 'nurturing';
  }
  return status === 'won' || status === 'lost';
}

export function getPipelineMoveNotice(
  leadLabel: string,
  nextStatus: CrmLeadStatus,
  activeStatusFilter: CrmLeadStatus | 'all'
): string | null {
  if (activeStatusFilter === 'all' || nextStatus === activeStatusFilter) {
    return null;
  }
  return `${leadLabel} moved to ${formatLeadStatusLabel(nextStatus)}.`;
}

export function toggleTableSortState(previous: LeadsTableSort, nextColumn: LeadsTableSortColumn): LeadsTableSort {
  if (previous.column !== nextColumn) {
    return { column: nextColumn, direction: 'asc' };
  }
  return {
    column: nextColumn,
    direction: previous.direction === 'asc' ? 'desc' : 'asc',
  };
}
