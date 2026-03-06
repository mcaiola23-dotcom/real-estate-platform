import { NextResponse } from "next/server";
import { enqueueWebsiteEvent } from "@real-estate/db/crm";
import type { WebsiteLeadSubmittedEvent } from "@real-estate/types/events";
import { LeadSubmissionSchema } from "../../lib/validators";
import { writeClient } from "../../lib/sanity.server";
import { getTenantContextFromRequest } from "../../lib/tenant/resolve-tenant";
import {
    enforceWebsiteApiGuard,
    maskEmail,
    maskPhone,
    readJsonBodyWithLimit,
    validateBotTokenIfRequired,
} from "../../lib/api-security";

const LEAD_ROUTE_POLICY = {
    routeId: "website-lead",
    maxRequests: 20,
    windowMs: 60_000,
    maxBodyBytes: 16_384,
} as const;

export async function POST(request: Request) {
    try {
        const guardResponse = enforceWebsiteApiGuard(request, LEAD_ROUTE_POLICY);
        if (guardResponse) {
            return guardResponse;
        }

        const bodyResult = await readJsonBodyWithLimit(request, LEAD_ROUTE_POLICY.maxBodyBytes);
        if (!bodyResult.ok) {
            return bodyResult.response;
        }

        const botTokenResponse = validateBotTokenIfRequired(bodyResult.body);
        if (botTokenResponse) {
            return botTokenResponse;
        }

        const result = LeadSubmissionSchema.safeParse(bodyResult.body);

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

        console.info("website.lead.submitted", {
            tenantId: leadEvent.tenant.tenantId,
            tenantSlug: leadEvent.tenant.tenantSlug,
            source: leadEvent.payload.source,
            contactEmailMasked: maskEmail(lead.email),
            contactPhoneMasked: maskPhone(lead.phone),
            hasPropertyDetails: Boolean(lead.propertyDetails),
        });

        const ingestionResult = await enqueueWebsiteEvent(leadEvent);
        if (!ingestionResult.accepted) {
            console.warn("CRM ingestion enqueue failed for lead event:", ingestionResult.reason);
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
