import { z } from "zod";

export const ValuationRequestSchema = z.object({
    address: z.string().min(5, "Address must be at least 5 characters"),
    propertyType: z.enum(["single-family", "condo", "multi-family"]),
    beds: z.union([z.string(), z.number()]).transform((val) => Number(val)),
    baths: z.union([z.string(), z.number()]).transform((val) => Number(val)),
    sqft: z.union([z.string(), z.number()]).transform((val) => Number(val)).optional(),
});

export type ValuationRequest = z.infer<typeof ValuationRequestSchema>;

export const LeadSubmissionSchema = z.object({
    name: z.string().optional(),
    email: z.string().email(),
    phone: z.string().min(10, "Phone number is too short"),
    timeframe: z.string().optional(),
    message: z.string().optional(),
    source: z.string().optional(),
    propertyDetails: ValuationRequestSchema.optional(),
    listingId: z.string().optional(),
    listingUrl: z.string().optional(),
    listingAddress: z.string().optional(),
});

export type LeadSubmission = z.infer<typeof LeadSubmissionSchema>;

const WebsiteSearchContextSchema = z.object({
    query: z.string().nullable(),
    filtersJson: z.string().nullable(),
    sortField: z.string().nullable(),
    sortOrder: z.string().nullable(),
    page: z.number().int().min(1).nullable(),
}).strict();

const WebsiteActorContextSchema = z.object({
    clerkUserId: z.string().nullable().optional(),
    sessionId: z.string().nullable().optional(),
}).strict();

const WebsiteListingInteractionPayloadSchema = z.object({
    source: z.string().min(1),
    listing: z.object({
        id: z.string().min(1),
        address: z.string().nullable(),
        city: z.string().nullable(),
        state: z.string().nullable(),
        zip: z.string().nullable(),
        price: z.number().finite().nullable(),
        beds: z.number().finite().nullable(),
        baths: z.number().finite().nullable(),
        sqft: z.number().finite().nullable(),
        propertyType: z.string().nullable(),
    }).strict(),
    searchContext: WebsiteSearchContextSchema.nullable(),
    actor: WebsiteActorContextSchema.nullable(),
}).strict();

const WebsiteSearchPerformedPayloadSchema = z.object({
    source: z.string().min(1),
    searchContext: WebsiteSearchContextSchema,
    resultCount: z.number().int().min(0).nullable(),
    actor: WebsiteActorContextSchema.nullable(),
}).strict();

const WebsiteSearchPerformedRequestSchema = z.object({
    eventType: z.literal("website.search.performed"),
    payload: WebsiteSearchPerformedPayloadSchema,
}).strict();

const WebsiteListingViewedRequestSchema = z.object({
    eventType: z.literal("website.listing.viewed"),
    payload: WebsiteListingInteractionPayloadSchema,
}).strict();

const WebsiteListingFavoritedRequestSchema = z.object({
    eventType: z.literal("website.listing.favorited"),
    payload: WebsiteListingInteractionPayloadSchema,
}).strict();

const WebsiteListingUnfavoritedRequestSchema = z.object({
    eventType: z.literal("website.listing.unfavorited"),
    payload: WebsiteListingInteractionPayloadSchema,
}).strict();

export const WebsiteEventRequestSchema = z.discriminatedUnion("eventType", [
    WebsiteSearchPerformedRequestSchema,
    WebsiteListingViewedRequestSchema,
    WebsiteListingFavoritedRequestSchema,
    WebsiteListingUnfavoritedRequestSchema,
]);

export type WebsiteEventRequest = z.infer<typeof WebsiteEventRequestSchema>;
