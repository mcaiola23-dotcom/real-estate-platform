import { randomUUID } from 'node:crypto';

import type {
  CrmTransaction,
  CrmTransactionWithRelations,
  CrmTransactionParty,
  CrmTransactionDocument,
  CrmTransactionMilestone,
  CrmTransactionListQuery,
  CrmTransactionCreateInput,
  CrmTransactionUpdateInput,
  CrmPagination,
  TransactionPartyRole,
  TransactionDocumentStatus,
  TransactionMilestoneType,
} from '@real-estate/types';

import { getPrismaClient } from './prisma-client';

function toIsoString(value: string | Date): string {
  return typeof value === 'string' ? value : value.toISOString();
}

function toNullableIso(value: string | Date | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return toIsoString(value);
}

function mapTransaction(row: Record<string, unknown>): CrmTransaction {
  return {
    id: row.id as string,
    tenantId: row.tenantId as string,
    leadId: (row.leadId as string) ?? null,
    contactId: (row.contactId as string) ?? null,
    propertyAddress: row.propertyAddress as string,
    status: row.status as CrmTransaction['status'],
    side: row.side as CrmTransaction['side'],
    salePrice: (row.salePrice as number) ?? null,
    listPrice: (row.listPrice as number) ?? null,
    closingDate: toNullableIso(row.closingDate as Date | null),
    contractDate: toNullableIso(row.contractDate as Date | null),
    inspectionDate: toNullableIso(row.inspectionDate as Date | null),
    appraisalDate: toNullableIso(row.appraisalDate as Date | null),
    titleDate: toNullableIso(row.titleDate as Date | null),
    notes: (row.notes as string) ?? null,
    createdAt: toIsoString(row.createdAt as Date),
    updatedAt: toIsoString(row.updatedAt as Date),
  };
}

function mapParty(row: Record<string, unknown>): CrmTransactionParty {
  return {
    id: row.id as string,
    transactionId: row.transactionId as string,
    tenantId: row.tenantId as string,
    role: row.role as TransactionPartyRole,
    name: row.name as string,
    email: (row.email as string) ?? null,
    phone: (row.phone as string) ?? null,
    company: (row.company as string) ?? null,
    createdAt: toIsoString(row.createdAt as Date),
    updatedAt: toIsoString(row.updatedAt as Date),
  };
}

function mapDocument(row: Record<string, unknown>): CrmTransactionDocument {
  return {
    id: row.id as string,
    transactionId: row.transactionId as string,
    tenantId: row.tenantId as string,
    documentType: row.documentType as string,
    fileName: row.fileName as string,
    status: row.status as TransactionDocumentStatus,
    notes: (row.notes as string) ?? null,
    createdAt: toIsoString(row.createdAt as Date),
    updatedAt: toIsoString(row.updatedAt as Date),
  };
}

function mapMilestone(row: Record<string, unknown>): CrmTransactionMilestone {
  return {
    id: row.id as string,
    transactionId: row.transactionId as string,
    tenantId: row.tenantId as string,
    milestoneType: row.milestoneType as TransactionMilestoneType,
    scheduledAt: toNullableIso(row.scheduledAt as Date | null),
    completedAt: toNullableIso(row.completedAt as Date | null),
    createdAt: toIsoString(row.createdAt as Date),
    updatedAt: toIsoString(row.updatedAt as Date),
  };
}

export async function createTransactionForTenant(
  tenantId: string,
  input: CrmTransactionCreateInput
): Promise<CrmTransaction> {
  const prisma = await getPrismaClient();
  const now = new Date();
  const row = await prisma.transaction.create({
    data: {
      id: randomUUID(),
      tenantId,
      leadId: input.leadId ?? null,
      contactId: input.contactId ?? null,
      propertyAddress: input.propertyAddress,
      status: input.status ?? 'under_contract',
      side: input.side,
      salePrice: input.salePrice ?? null,
      listPrice: input.listPrice ?? null,
      closingDate: input.closingDate ? new Date(input.closingDate) : null,
      contractDate: input.contractDate ? new Date(input.contractDate) : null,
      inspectionDate: input.inspectionDate ? new Date(input.inspectionDate) : null,
      appraisalDate: input.appraisalDate ? new Date(input.appraisalDate) : null,
      titleDate: input.titleDate ? new Date(input.titleDate) : null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    },
  });
  return mapTransaction(row as unknown as Record<string, unknown>);
}

export async function updateTransactionForTenant(
  tenantId: string,
  transactionId: string,
  input: CrmTransactionUpdateInput
): Promise<CrmTransaction | null> {
  const prisma = await getPrismaClient();
  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, tenantId },
  });
  if (!existing) {
    return null;
  }

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (input.propertyAddress !== undefined) data.propertyAddress = input.propertyAddress;
  if (input.status !== undefined) data.status = input.status;
  if (input.side !== undefined) data.side = input.side;
  if (input.salePrice !== undefined) data.salePrice = input.salePrice;
  if (input.listPrice !== undefined) data.listPrice = input.listPrice;
  if (input.closingDate !== undefined) data.closingDate = input.closingDate ? new Date(input.closingDate) : null;
  if (input.contractDate !== undefined) data.contractDate = input.contractDate ? new Date(input.contractDate) : null;
  if (input.inspectionDate !== undefined) data.inspectionDate = input.inspectionDate ? new Date(input.inspectionDate) : null;
  if (input.appraisalDate !== undefined) data.appraisalDate = input.appraisalDate ? new Date(input.appraisalDate) : null;
  if (input.titleDate !== undefined) data.titleDate = input.titleDate ? new Date(input.titleDate) : null;
  if (input.notes !== undefined) data.notes = input.notes;

  const row = await prisma.transaction.update({
    where: { id: transactionId },
    data,
  });
  return mapTransaction(row as unknown as Record<string, unknown>);
}

export async function listTransactionsForTenant(
  tenantId: string,
  query: CrmTransactionListQuery = {}
): Promise<{ transactions: CrmTransaction[]; pagination: CrmPagination }> {
  const prisma = await getPrismaClient();
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
  const offset = Math.max(query.offset ?? 0, 0);

  const where: Record<string, unknown> = { tenantId };
  if (query.status) where.status = query.status;
  if (query.side) where.side = query.side;

  const rows = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    skip: offset,
  });

  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;

  return {
    transactions: (slice as Array<Record<string, unknown>>).map((r) => mapTransaction(r)),
    pagination: {
      limit,
      offset,
      nextOffset: hasMore ? offset + limit : null,
    },
  };
}

export async function getTransactionByIdForTenant(
  tenantId: string,
  transactionId: string
): Promise<CrmTransactionWithRelations | null> {
  const prisma = await getPrismaClient();
  const row = await prisma.transaction.findFirst({
    where: { id: transactionId, tenantId },
    include: {
      parties: { orderBy: { createdAt: 'asc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      milestones: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!row) return null;

  const rowAny = row as unknown as Record<string, unknown>;
  const base = mapTransaction(rowAny);
  const parties = (rowAny.parties as Array<Record<string, unknown>>) ?? [];
  const documents = (rowAny.documents as Array<Record<string, unknown>>) ?? [];
  const milestones = (rowAny.milestones as Array<Record<string, unknown>>) ?? [];
  return {
    ...base,
    parties: parties.map((p) => mapParty(p)),
    documents: documents.map((d) => mapDocument(d)),
    milestones: milestones.map((m) => mapMilestone(m)),
  };
}

export async function addTransactionParty(
  tenantId: string,
  transactionId: string,
  input: { role: string; name: string; email?: string | null; phone?: string | null; company?: string | null }
): Promise<CrmTransactionParty | null> {
  const prisma = await getPrismaClient();
  const txn = await prisma.transaction.findFirst({ where: { id: transactionId, tenantId } });
  if (!txn) return null;

  const now = new Date();
  const row = await prisma.transactionParty.create({
    data: {
      id: randomUUID(),
      transactionId,
      tenantId,
      role: input.role,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      company: input.company ?? null,
      createdAt: now,
      updatedAt: now,
    },
  });
  return mapParty(row as unknown as Record<string, unknown>);
}

export async function updateTransactionParty(
  tenantId: string,
  partyId: string,
  input: { role?: string; name?: string; email?: string | null; phone?: string | null; company?: string | null }
): Promise<CrmTransactionParty | null> {
  const prisma = await getPrismaClient();
  const existing = await prisma.transactionParty.findFirst({ where: { id: partyId, tenantId } });
  if (!existing) return null;

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (input.role !== undefined) data.role = input.role;
  if (input.name !== undefined) data.name = input.name;
  if (input.email !== undefined) data.email = input.email;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.company !== undefined) data.company = input.company;

  const row = await prisma.transactionParty.update({ where: { id: partyId }, data });
  return mapParty(row as unknown as Record<string, unknown>);
}

export async function listTransactionParties(
  tenantId: string,
  transactionId: string
): Promise<CrmTransactionParty[]> {
  const prisma = await getPrismaClient();
  const rows = await prisma.transactionParty.findMany({
    where: { transactionId, tenantId },
    orderBy: { createdAt: 'asc' },
  });
  return (rows as Array<Record<string, unknown>>).map((r) => mapParty(r));
}

export async function addTransactionDocument(
  tenantId: string,
  transactionId: string,
  input: { documentType: string; fileName: string; status?: string; notes?: string | null }
): Promise<CrmTransactionDocument | null> {
  const prisma = await getPrismaClient();
  const txn = await prisma.transaction.findFirst({ where: { id: transactionId, tenantId } });
  if (!txn) return null;

  const now = new Date();
  const row = await prisma.transactionDocument.create({
    data: {
      id: randomUUID(),
      transactionId,
      tenantId,
      documentType: input.documentType,
      fileName: input.fileName,
      status: input.status ?? 'pending',
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    },
  });
  return mapDocument(row as unknown as Record<string, unknown>);
}

export async function listTransactionDocuments(
  tenantId: string,
  transactionId: string
): Promise<CrmTransactionDocument[]> {
  const prisma = await getPrismaClient();
  const rows = await prisma.transactionDocument.findMany({
    where: { transactionId, tenantId },
    orderBy: { createdAt: 'desc' },
  });
  return (rows as Array<Record<string, unknown>>).map((r) => mapDocument(r));
}

export async function addTransactionMilestone(
  tenantId: string,
  transactionId: string,
  input: { milestoneType: string; scheduledAt?: string | null; completedAt?: string | null }
): Promise<CrmTransactionMilestone | null> {
  const prisma = await getPrismaClient();
  const txn = await prisma.transaction.findFirst({ where: { id: transactionId, tenantId } });
  if (!txn) return null;

  const now = new Date();
  const row = await prisma.transactionMilestone.create({
    data: {
      id: randomUUID(),
      transactionId,
      tenantId,
      milestoneType: input.milestoneType,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      completedAt: input.completedAt ? new Date(input.completedAt) : null,
      createdAt: now,
      updatedAt: now,
    },
  });
  return mapMilestone(row as unknown as Record<string, unknown>);
}

export async function updateTransactionMilestone(
  tenantId: string,
  milestoneId: string,
  input: { scheduledAt?: string | null; completedAt?: string | null }
): Promise<CrmTransactionMilestone | null> {
  const prisma = await getPrismaClient();
  const existing = await prisma.transactionMilestone.findFirst({ where: { id: milestoneId, tenantId } });
  if (!existing) return null;

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (input.scheduledAt !== undefined) data.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  if (input.completedAt !== undefined) data.completedAt = input.completedAt ? new Date(input.completedAt) : null;

  const row = await prisma.transactionMilestone.update({ where: { id: milestoneId }, data });
  return mapMilestone(row as unknown as Record<string, unknown>);
}

export async function listTransactionMilestones(
  tenantId: string,
  transactionId: string
): Promise<CrmTransactionMilestone[]> {
  const prisma = await getPrismaClient();
  const rows = await prisma.transactionMilestone.findMany({
    where: { transactionId, tenantId },
    orderBy: { createdAt: 'asc' },
  });
  return (rows as Array<Record<string, unknown>>).map((r) => mapMilestone(r));
}
