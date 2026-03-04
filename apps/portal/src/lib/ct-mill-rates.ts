/**
 * Connecticut Property Tax Mill Rates — Fairfield County
 *
 * Source: CT Office of Policy and Management (OPM) via data.ct.gov
 * Dataset: "Mill Rates for FY 2014-2026" (emyx-j53e)
 * Fiscal Year: 2025-2026 (FY 2026), Grand List Year: 2024
 *
 * Mill rate = dollars of tax per $1,000 of assessed value
 * Annual Tax = (Assessment Total × Mill Rate) / 1000
 *
 * NOTE: CT assessments are at 70% of fair market value.
 * NOTE: Mill rates change annually. Update this file each July when new rates are published.
 */

export const CT_MILL_RATES: Record<string, number> = {
  'Bethel': 30.41,
  'Bridgeport': 43.45,
  'Brookfield': 28.93,
  'Danbury': 24.99,
  'Darien': 15.48,
  'Easton': 31.00,
  'Fairfield': 28.39,
  'Greenwich': 12.041,
  'Monroe': 28.67,
  'New Canaan': 16.691,
  'New Fairfield': 26.33,
  'Newtown': 28.74,
  'Norwalk': 32.00,
  'Redding': 29.54,
  'Ridgefield': 27.39,
  'Shelton': 18.82,
  'Sherman': 16.67,
  'Stamford': 27.17,
  'Stratford': 40.20,
  'Trumbull': 35.69,
  'Weston': 23.90,
  'Westport': 18.86,
  'Wilton': 24.4054,
};

export const CT_MILL_RATE_FISCAL_YEAR = '2025-2026';
export const CT_MILL_RATE_GRAND_LIST_YEAR = 2024;

/**
 * Calculate estimated annual property tax from assessment value and town name.
 * Returns null if town is not in the lookup table or assessment is not available.
 */
export function calculateEstimatedTax(
  assessmentTotal: number | null | undefined,
  city: string | null | undefined
): number | null {
  if (assessmentTotal == null || !city) return null;

  // Normalize city name for lookup (handle case variations)
  const normalized = city
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const millRate = CT_MILL_RATES[normalized];
  if (millRate == null) return null;

  return Math.round((assessmentTotal * millRate) / 1000);
}
