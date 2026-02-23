import {
  getLeadByIdForTenant,
  getContactByIdForTenant,
  listShowingsByTenantId,
} from '@real-estate/db/crm';
import { listTransactionsForTenant } from '@real-estate/db/transactions';
import type { CrmContact, CrmShowing, CrmTransaction } from '@real-estate/types';
import { NextResponse } from 'next/server';

import { verifyPortalToken } from '../../lib/portal-token';
import type { PortalTokenPayload } from '../../lib/portal-token';

// ---------------------------------------------------------------------------
// Route context type for dynamic segments
// ---------------------------------------------------------------------------

interface RouteContext {
  params: Promise<{
    token: string;
  }>;
}

// ---------------------------------------------------------------------------
// Dependency injection types
// ---------------------------------------------------------------------------

interface PortalGetDeps {
  verifyPortalToken: (token: string) => PortalTokenPayload | null;
  getLeadByIdForTenant: typeof getLeadByIdForTenant;
  getContactByIdForTenant: typeof getContactByIdForTenant;
  listShowingsByTenantId: typeof listShowingsByTenantId;
  listTransactionsForTenant: typeof listTransactionsForTenant;
}

const defaultDeps: PortalGetDeps = {
  verifyPortalToken,
  getLeadByIdForTenant,
  getContactByIdForTenant,
  listShowingsByTenantId,
  listTransactionsForTenant,
};

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

export function createPortalGetHandler(deps: PortalGetDeps = defaultDeps) {
  return async function GET(_request: Request, context: RouteContext) {
    const { token } = await context.params;

    // Validate and decode token
    const payload = deps.verifyPortalToken(token);
    if (!payload) {
      return NextResponse.json(
        { ok: false, error: 'Invalid or expired link' },
        { status: 401 }
      );
    }

    const { tenantId, leadId } = payload;

    // Fetch lead data
    const lead = await deps.getLeadByIdForTenant(tenantId, leadId);
    if (!lead) {
      return NextResponse.json(
        { ok: false, error: 'Invalid or expired link' },
        { status: 404 }
      );
    }

    // Fetch contact info (agent context)
    let contact: CrmContact | null = null;
    if (lead.contactId) {
      contact = await deps.getContactByIdForTenant(tenantId, lead.contactId);
    }

    // Fetch showings for this lead
    let showings: CrmShowing[] = [];
    try {
      showings = await deps.listShowingsByTenantId(tenantId, {
        leadId,
        limit: 20,
      });
    } catch {
      // Non-critical — continue without showings
    }

    // Fetch transactions for this lead
    let transactions: CrmTransaction[] = [];
    try {
      const result = await deps.listTransactionsForTenant(tenantId, {
        limit: 10,
      });
      // Filter to transactions associated with this lead
      transactions = result.transactions.filter(
        (tx) => tx.leadId === leadId || tx.contactId === lead.contactId
      );
    } catch {
      // Non-critical — continue without transactions
    }

    // Build the portal response (only expose client-safe fields)
    return NextResponse.json({
      ok: true,
      portal: {
        lead: {
          id: lead.id,
          status: lead.status,
          listingAddress: lead.listingAddress,
          propertyType: lead.propertyType,
          beds: lead.beds,
          baths: lead.baths,
          sqft: lead.sqft,
          priceMin: lead.priceMin,
          priceMax: lead.priceMax,
          timeframe: lead.timeframe,
        },
        contact: contact
          ? {
              fullName: contact.fullName,
              email: contact.email,
              phone: contact.phone,
            }
          : null,
        showings: showings.map((s) => ({
          id: s.id,
          propertyAddress: s.propertyAddress,
          scheduledAt: s.scheduledAt,
          duration: s.duration,
          status: s.status,
          notes: s.notes,
        })),
        transactions: transactions.map((tx) => ({
          id: tx.id,
          propertyAddress: tx.propertyAddress,
          status: tx.status,
          side: tx.side,
          salePrice: tx.salePrice,
          listPrice: tx.listPrice,
          closingDate: tx.closingDate,
          contractDate: tx.contractDate,
        })),
      },
    });
  };
}

export const GET = createPortalGetHandler();
