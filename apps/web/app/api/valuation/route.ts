import { NextResponse } from "next/server";
import { ValuationRequestSchema } from "../../lib/validators";
import { getTenantContextFromRequest } from "../../lib/tenant/resolve-tenant";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = ValuationRequestSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { status: "error", errors: result.error.issues },
                { status: 400 }
            );
        }

        const tenantContext = getTenantContextFromRequest(request);
        const { propertyType, beds, baths, sqft } = result.data;

        console.log("VALUATION REQUEST TENANT:", tenantContext.tenantId, tenantContext.tenantSlug);

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
