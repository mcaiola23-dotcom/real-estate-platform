import {
  DEFAULT_FILTERS,
  ListingFilters,
  ListingSort,
  ListingSortField,
  ListingStatus,
  PropertyType,
} from "../../lib/data/providers/listings.types";

const VALID_SORT_FIELDS: ListingSortField[] = ["price", "listedAt", "beds", "sqft"];

interface SearchParamsReader {
  get(name: string): string | null;
}

export function parseSortField(value: string | null): ListingSortField {
  if (!value) {
    return "listedAt";
  }
  return VALID_SORT_FIELDS.includes(value as ListingSortField) ? (value as ListingSortField) : "listedAt";
}

export function parseSortOrder(value: string | null): "asc" | "desc" {
  return value === "asc" ? "asc" : "desc";
}

export function parseFiltersFromParams(searchParams: SearchParamsReader): ListingFilters {
  return {
    ...DEFAULT_FILTERS,
    status: searchParams.get("status")
      ? (searchParams.get("status")!.split(",") as ListingStatus[])
      : ["active"],
    propertyTypes: searchParams.get("types")
      ? (searchParams.get("types")!.split(",") as PropertyType[])
      : undefined,
    priceMin: searchParams.get("min_price") ? Number(searchParams.get("min_price")) : 0,
    priceMax: searchParams.get("max_price") ? Number(searchParams.get("max_price")) : 10000000,
    bedsMin: searchParams.get("beds") ? Number(searchParams.get("beds")) : 0,
    bathsMin: searchParams.get("baths") ? Number(searchParams.get("baths")) : 0,
    sqftMin: searchParams.get("min_sqft") ? Number(searchParams.get("min_sqft")) : 0,
    sqftMax: searchParams.get("max_sqft") ? Number(searchParams.get("max_sqft")) : 10000,
  };
}

export function parseSortFromParams(searchParams: SearchParamsReader): ListingSort {
  const sortParam = searchParams.get("sort");
  if (sortParam) {
    const [rawField, rawOrder] = sortParam.split("-");
    return { field: parseSortField(rawField), order: parseSortOrder(rawOrder) };
  }
  return { field: "listedAt", order: "desc" };
}

export function buildSearchUrlParams({
  searchQuery,
  page,
  townSlugs,
  neighborhoodSlugs,
  filters,
  sort,
  selectedListingId,
}: {
  searchQuery: string;
  page: number;
  townSlugs: string[];
  neighborhoodSlugs: string[];
  filters: ListingFilters;
  sort: ListingSort;
  selectedListingId: string | null;
}): URLSearchParams {
  const params = new URLSearchParams();

  if (searchQuery) params.set("q", searchQuery);
  if (page > 1) params.set("page", page.toString());
  if (townSlugs.length > 0) params.set("towns", townSlugs.join(","));
  if (neighborhoodSlugs.length > 0) params.set("neighborhoods", neighborhoodSlugs.join(","));
  if (filters.status && filters.status.join(",") !== "active") params.set("status", filters.status.join(","));
  if (filters.propertyTypes && filters.propertyTypes.length > 0) params.set("types", filters.propertyTypes.join(","));
  if (filters.priceMin && filters.priceMin > 0) params.set("min_price", filters.priceMin.toString());
  if (filters.priceMax && filters.priceMax < 10000000) params.set("max_price", filters.priceMax.toString());
  if (filters.bedsMin && filters.bedsMin > 0) params.set("beds", filters.bedsMin.toString());
  if (filters.bathsMin && filters.bathsMin > 0) params.set("baths", filters.bathsMin.toString());
  if (filters.sqftMin && filters.sqftMin > 0) params.set("min_sqft", filters.sqftMin.toString());
  if (filters.sqftMax && filters.sqftMax < 10000) params.set("max_sqft", filters.sqftMax.toString());

  if (sort.field !== "listedAt" || sort.order !== "desc") {
    params.set("sort", `${sort.field}-${sort.order}`);
  }

  if (selectedListingId) {
    params.set("listing_id", selectedListingId);
  }

  return params;
}

export function parseSavedSearchParams(paramsString: string) {
  const parsed = new URLSearchParams(paramsString);
  return {
    searchQuery: parsed.get("q") || "",
    page: parseInt(parsed.get("page") || "1", 10),
    townSlugs: parsed.get("towns") ? parsed.get("towns")!.split(",") : [],
    neighborhoodSlugs: parsed.get("neighborhoods") ? parsed.get("neighborhoods")!.split(",") : [],
    filters: parseFiltersFromParams(parsed),
    sort: parseSortFromParams(parsed),
  };
}

export function buildSavedSearchParams({
  searchQuery,
  townSlugs,
  neighborhoodSlugs,
  filters,
  sort,
}: {
  searchQuery: string;
  townSlugs: string[];
  neighborhoodSlugs: string[];
  filters: ListingFilters;
  sort: ListingSort;
}): URLSearchParams {
  return buildSearchUrlParams({
    searchQuery,
    page: 1,
    townSlugs,
    neighborhoodSlugs,
    filters,
    sort,
    selectedListingId: null,
  });
}
