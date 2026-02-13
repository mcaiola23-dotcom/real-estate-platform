import { NextResponse } from "next/server";
import { ingestWebsiteEvent } from "@real-estate/db/crm";
import type { WebsiteLeadSubmittedEvent } from "@real-estate/types/events";
import { LeadSubmissionSchema } from "../../lib/validators";
import { writeClient } from "../../lib/sanity.server";
import { getTenantContextFromRequest } from "../../lib/tenant/resolve-tenant";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = LeadSubmissionSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { status: "error", errors: result.error.issues },
                { status: 400 }
            );
        }

        const lead = result.data;
        const tenantContext = await getTenantContextFromRequest(request);
        const timestamp = new Date().toISOString();
        const leadEvent: WebsiteLeadSubmittedEvent = {
            eventType: "website.lead.submitted",
            version: 1,
            occurredAt: timestamp,
            tenant: {
                tenantId: tenantContext.tenantId,
                tenantSlug: tenantContext.tenantSlug,
                tenantDomain: tenantContext.tenantDomain,
            },
            payload: {
                source: lead.source || "unknown",
                contact: {
                    name: lead.name || null,
                    email: lead.email,
                    phone: lead.phone,
                },
                timeframe: lead.timeframe || null,
                message: lead.message || null,
                listing: {
                    id: lead.listingId || null,
                    url: lead.listingUrl || null,
                    address: lead.listingAddress || lead.propertyDetails?.address || null,
                },
                propertyDetails: lead.propertyDetails
                    ? {
                        propertyType: lead.propertyDetails.propertyType,
                        beds: lead.propertyDetails.beds,
                        baths: lead.propertyDetails.baths,
                        sqft: lead.propertyDetails.sqft ?? null,
                    }
                    : null,
            },
        };

        // Logging for immediate debug
        console.log("------------------------------------------------");
        console.log("NEW HOME VALUE LEAD RECEIVED");
        console.log("Tenant:", leadEvent.tenant.tenantId, leadEvent.tenant.tenantSlug, leadEvent.tenant.tenantDomain);
        console.log("Contact:", lead.email, lead.phone);
        console.log("------------------------------------------------");

        const ingestionResult = await ingestWebsiteEvent(leadEvent);
        if (!ingestionResult.accepted) {
            console.warn("CRM ingestion skipped for lead event:", ingestionResult.reason);
        }

        // Prepare Sanity Document
        const doc = {
            _type: 'lead',
            source: leadEvent.payload.source,
            fullName: lead.name,
            email: lead.email,
            phone: lead.phone,
            tenantId: leadEvent.tenant.tenantId,
            tenantSlug: leadEvent.tenant.tenantSlug,
            tenantDomain: leadEvent.tenant.tenantDomain,
            // Property details are optional now
            address: leadEvent.payload.listing.address,
            propertyType: lead.propertyDetails?.propertyType,
            beds: lead.propertyDetails?.beds,
            baths: lead.propertyDetails?.baths,
            sqft: lead.propertyDetails?.sqft,

            listingId: lead.listingId,
            listingUrl: lead.listingUrl,

            timeframe: lead.timeframe,
            notes: lead.message, // Map message to notes
            createdAt: timestamp,
        };

        // Create in Sanity
        // Note: writeClient requires SANITY_API_WRITE_TOKEN to be set.
        // If not set, it might throw or just fail auth.
        try {
            if (process.env.SANITY_API_WRITE_TOKEN) {
                const response = await writeClient.create(doc);
                return NextResponse.json({ success: true, id: response._id });
            } else {
                console.warn("SANITY_API_WRITE_TOKEN not set. Lead not saved to Sanity.");
                // We still return success to the UI because the email/logging part (conceptual) succeeded
                return NextResponse.json({ success: true, saved: false, message: "Server configuration pending" });
            }
        } catch (sanityError) {
            console.error("Sanity Write Error:", sanityError);
            // Don't fail the user request if Sanity write fails, but log it critical
            return NextResponse.json({ success: true, saved: false, error: "Persistence failed" });
        }

    } catch (error) {
        console.error("Lead API Error:", error);
        return NextResponse.json(
            { status: "error", message: "Internal server error" },
            { status: 500 }
        );
    }
}
