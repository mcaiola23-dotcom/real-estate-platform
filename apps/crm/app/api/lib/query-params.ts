import type {
  CrmActivityListQuery,
  CrmContactListQuery,
  CrmLeadListQuery,
  CrmLeadStatus,
  CrmLeadType,
  CrmPagination,
  CrmTransactionListQuery,
  TransactionStatus,
  TransactionSide,
} from '@real-estate/types';

const VALID_STATUSES: Set<CrmLeadStatus> = new Set(['new', 'qualified', 'nurturing', 'won', 'lost']);
const VALID_LEAD_TYPES: Set<CrmLeadType> = new Set(['website_lead', 'valuation_request']);
const VALID_TXN_STATUSES: Set<TransactionStatus> = new Set([
  'under_contract', 'inspection', 'appraisal', 'title', 'closing', 'closed', 'fallen_through',
]);
const VALID_TXN_SIDES: Set<TransactionSide> = new Set(['buyer', 'seller', 'dual']);

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(parsed, 0);
}

export function parsePaginationQuery(searchParams: URLSearchParams): { limit: number; offset: number } {
  const parsedLimit = parsePositiveInt(searchParams.get('limit'), DEFAULT_LIMIT);
  const limit = Math.min(Math.max(parsedLimit, 1), MAX_LIMIT);
  const offset = parsePositiveInt(searchParams.get('offset'), 0);
  return { limit, offset };
}

function parseOptionalString(value: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function parseLeadListQuery(searchParams: URLSearchParams): CrmLeadListQuery {
  const { limit, offset } = parsePaginationQuery(searchParams);
  const statusValue = searchParams.get('status');
  const leadTypeValue = searchParams.get('leadType');
  return {
    status: statusValue && VALID_STATUSES.has(statusValue as CrmLeadStatus) ? (statusValue as CrmLeadStatus) : undefined,
    leadType:
      leadTypeValue && VALID_LEAD_TYPES.has(leadTypeValue as CrmLeadType) ? (leadTypeValue as CrmLeadType) : undefined,
    source: parseOptionalString(searchParams.get('source')),
    contactId: parseOptionalString(searchParams.get('contactId')),
    tag: parseOptionalString(searchParams.get('tag')),
    limit,
    offset,
  };
}

export function parseContactListQuery(searchParams: URLSearchParams): CrmContactListQuery {
  const { limit, offset } = parsePaginationQuery(searchParams);
  return {
    source: parseOptionalString(searchParams.get('source')),
    search: parseOptionalString(searchParams.get('search')),
    limit,
    offset,
  };
}

export function parseActivityListQuery(searchParams: URLSearchParams): CrmActivityListQuery {
  const { limit, offset } = parsePaginationQuery(searchParams);
  return {
    leadId: parseOptionalString(searchParams.get('leadId')),
    contactId: parseOptionalString(searchParams.get('contactId')),
    activityType: parseOptionalString(searchParams.get('activityType')),
    limit,
    offset,
  };
}

export function parseTransactionListQuery(searchParams: URLSearchParams): CrmTransactionListQuery {
  const { limit, offset } = parsePaginationQuery(searchParams);
  const statusValue = searchParams.get('status');
  const sideValue = searchParams.get('side');
  return {
    status: statusValue && VALID_TXN_STATUSES.has(statusValue as TransactionStatus) ? (statusValue as TransactionStatus) : undefined,
    side: sideValue && VALID_TXN_SIDES.has(sideValue as TransactionSide) ? (sideValue as TransactionSide) : undefined,
    limit,
    offset,
  };
}

export function buildPagination(limit: number, offset: number, resultCount: number): CrmPagination {
  return {
    limit,
    offset,
    nextOffset: resultCount === limit ? offset + resultCount : null,
  };
}
