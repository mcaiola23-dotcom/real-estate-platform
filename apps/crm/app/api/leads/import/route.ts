import { createContactForTenant, createLeadForTenant } from '@real-estate/db/crm';
import type { CrmLead, CrmLeadType } from '@real-estate/types/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../lib/tenant-route';

interface ImportRow {
  fullName?: string;
  email?: string;
  phone?: string;
  listingAddress?: string;
  leadType?: string;
  propertyType?: string;
  beds?: number | string;
  baths?: number | string;
  sqft?: number | string;
  priceMin?: number | string;
  priceMax?: number | string;
  notes?: string;
  source?: string;
  timeframe?: string;
}

const VALID_LEAD_TYPES = new Set(['buyer', 'seller', 'investor', 'renter', 'other', 'website_lead', 'valuation_request']);

export async function POST(request: Request) {
  const { tenantContext, unauthorizedResponse } = await requireTenantContext(request);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  if (!tenantContext) {
    return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
  }

  let body: { rows: ImportRow[] };
  try {
    body = (await request.json()) as { rows: ImportRow[] };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ ok: false, error: 'rows array is required and must not be empty.' }, { status: 400 });
  }

  if (body.rows.length > 500) {
    return NextResponse.json({ ok: false, error: 'Maximum 500 rows per import.' }, { status: 400 });
  }

  const imported: CrmLead[] = [];
  const errors: { row: number; error: string }[] = [];

  for (let i = 0; i < body.rows.length; i++) {
    const row = body.rows[i];
    const hasContact = row.fullName?.trim() || row.email?.trim() || row.phone?.trim();

    try {
      let contactId: string | null = null;

      if (hasContact) {
        const contact = await createContactForTenant(tenantContext.tenantId, {
          fullName: row.fullName?.trim() || null,
          email: row.email?.trim() || null,
          phone: row.phone?.trim() || null,
          source: row.source?.trim() || 'csv_import',
        });
        contactId = contact?.id ?? null;
      }

      const lead = await createLeadForTenant(tenantContext.tenantId, {
        contactId,
        leadType: VALID_LEAD_TYPES.has(row.leadType || '') ? (row.leadType as CrmLeadType) : 'buyer',
        source: row.source?.trim() || 'csv_import',
        listingAddress: row.listingAddress?.trim() || null,
        propertyType: row.propertyType?.trim() || null,
        beds: row.beds ? Number(row.beds) || null : null,
        baths: row.baths ? Number(row.baths) || null : null,
        sqft: row.sqft ? Number(row.sqft) || null : null,
        priceMin: row.priceMin ? Number(row.priceMin) || null : null,
        priceMax: row.priceMax ? Number(row.priceMax) || null : null,
        notes: row.notes?.trim() || null,
        timeframe: row.timeframe?.trim() || null,
      });

      if (lead) {
        imported.push(lead);
      } else {
        errors.push({ row: i + 1, error: 'Failed to create lead.' });
      }
    } catch {
      errors.push({ row: i + 1, error: 'Unexpected error creating lead.' });
    }
  }

  return NextResponse.json({
    ok: true,
    tenantId: tenantContext.tenantId,
    imported: imported.length,
    errors: errors.length,
    errorDetails: errors.length > 0 ? errors.slice(0, 20) : [],
  }, { status: 201 });
}
