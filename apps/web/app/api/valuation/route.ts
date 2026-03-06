import { NextResponse } from "next/server";
import { enqueueWebsiteEvent } from "@real-estate/db/crm";
import type { WebsiteValuationRequestedEvent } from "@real-estate/types/events";
import { ValuationRequestSchema } from "../../lib/validators";
import { getTenantContextFromRequest } from "../../lib/tenant/resolve-tenant";
import {
    enforceWebsiteApiGuard,
    readJsonBodyWithLimit,
    validateBotTokenIfRequired,
} from "../../lib/api-security";

const VALUATION_ROUTE_POLICY = {
    routeId: "website-valuation",
    maxRequests: 20,
    windowMs: 60_000,
    maxBodyBytes: 12_288,
} as const;

export async function POST(request: Request) {
    try {
        const guardResponse = enforceWebsiteApiGuard(request, VALUATION_ROUTE_POLICY);
        if (guardResponse) {
            return guardResponse;
        }

        const bodyResult = await readJsonBodyWithLimit(request, VALUATION_ROUTE_POLICY.maxBodyBytes);
        if (!bodyResult.ok) {
            return bodyResult.response;
        }

        const botTokenResponse = validateBotTokenIfRequired(bodyResult.body);
        if (botTokenResponse) {
            return botTokenResponse;
        }

        const result = ValuationRequestSchema.safeParse(bodyResult.body);

        if (!result.success) {
            return NextResponse.json(
                { status: "error", errors: result.error.issues },
                { status: 400 }
            );
        }

        const tenantContext = await getTenantContextFromRequest(request);
        const { propertyType, beds, baths, sqft } = result.data;
        const valuationEvent: WebsiteValuationRequestedEvent = {
            eventType: "website.valuation.requested",
            version: 1,
            occurredAt: new Date().toISOString(),
            tenant: {
                tenantId: tenantContext.tenantId,
                tenantSlug: tenantContext.tenantSlug,
                tenantDomain: tenantContext.tenantDomain,
            },
            payload: {
                address: result.data.address,
                propertyType,
                beds,
                baths,
                sqft: sqft ?? null,
            },
        };

        console.info("website.valuation.requested", {
            tenantId: valuationEvent.tenant.tenantId,
            tenantSlug: valuationEvent.tenant.tenantSlug,
            propertyType: valuationEvent.payload.propertyType,
            hasSqft: valuationEvent.payload.sqft !== null,
        });
        const ingestionResult = await enqueueWebsiteEvent(valuationEvent);
        if (!ingestionResult.accepted) {
            console.warn("CRM ingestion enqueue failed for valuation event:", ingestionResult.reason);
        }

        // Placeholder Logic
        // Conservative constraints:
        // - Multi-family always triggers review (harder to value automatically)
        // - Missing sqft triggers lower confidence or wider range
        // - Very small/large values trigger review

        if (propertyType === "multi-family") {
            return NextResponse.json({
                status: "needs_review",
                reason: "Multi-family properties require complex analysis.",
            });
        }

        if (beds > 10 || baths > 10) {
            return NextResponse.json({
                status: "needs_review",
                reason: "Property size is outside typical automated range.",
            });
        }

        // Base value by type
        let baseValue = propertyType === "condo" ? 300000 : 500000;

        // Adjustments
        baseValue += beds * 50000;
        baseValue += baths * 30000;

        let confidence: "high" | "medium" | "low" = "medium";

        if (sqft) {
            // Simple sqft check
            if (sqft < 500 || sqft > 10000) {
                return NextResponse.json({
                    status: "needs_review",
                    reason: "Square footage is outside typical automated range.",
                });
            }
            baseValue += sqft * 200;
            confidence = "high";
        } else {
            confidence = "low";
        }

        // Calculate Range (+/- 10% for high confidence, +/- 20% for low)
        const margin = confidence === "high" ? 0.10 : 0.20;
        const low = Math.round(baseValue * (1 - margin));
        const high = Math.round(baseValue * (1 + margin));

        return NextResponse.json({
            status: "ok",
            low,
            high,
            confidence,
            method: "placeholder",
        });

    } catch (error) {
        console.error("Valuation API Error:", error);
        return NextResponse.json(
            { status: "error", message: "Internal server error" },
            { status: 500 }
        );
    }
}
