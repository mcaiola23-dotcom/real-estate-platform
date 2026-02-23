'use client';

interface MlsPropertyCardProps {
  listingAddress?: string;
  priceMin?: number | null;
  priceMax?: number | null;
  propertyType?: string | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function formatPriceRange(min?: number | null, max?: number | null): string | null {
  if (min != null && max != null) {
    return `${currencyFormatter.format(min)} - ${currencyFormatter.format(max)}`;
  }
  if (min != null) {
    return `From ${currencyFormatter.format(min)}`;
  }
  if (max != null) {
    return `Up to ${currencyFormatter.format(max)}`;
  }
  return null;
}

export function MlsPropertyCard({
  listingAddress,
  priceMin,
  priceMax,
  propertyType,
  beds,
  baths,
  sqft,
}: MlsPropertyCardProps) {
  const hasAnyDetail =
    listingAddress ||
    priceMin != null ||
    priceMax != null ||
    propertyType ||
    beds != null ||
    baths != null ||
    sqft != null;

  if (!hasAnyDetail) {
    return (
      <div className="crm-mls-card">
        <p className="crm-muted">No listing details available</p>
      </div>
    );
  }

  const priceRange = formatPriceRange(priceMin, priceMax);

  return (
    <div className="crm-mls-card">
      {listingAddress && (
        <h4 className="crm-mls-card-title">{listingAddress}</h4>
      )}

      <div className="crm-mls-card-grid">
        {beds != null && (
          <div className="crm-mls-card-detail">
            <span className="crm-mls-card-label">Beds</span>
            <span className="crm-mls-card-value">{beds}</span>
          </div>
        )}
        {baths != null && (
          <div className="crm-mls-card-detail">
            <span className="crm-mls-card-label">Baths</span>
            <span className="crm-mls-card-value">{baths}</span>
          </div>
        )}
        {sqft != null && (
          <div className="crm-mls-card-detail">
            <span className="crm-mls-card-label">Sqft</span>
            <span className="crm-mls-card-value">{sqft.toLocaleString()}</span>
          </div>
        )}
        {priceRange && (
          <div className="crm-mls-card-detail">
            <span className="crm-mls-card-label">Price Range</span>
            <span className="crm-mls-card-value">{priceRange}</span>
          </div>
        )}
        {propertyType && (
          <div className="crm-mls-card-detail">
            <span className="crm-mls-card-label">Type</span>
            <span className="crm-mls-card-value">{propertyType}</span>
          </div>
        )}
      </div>
    </div>
  );
}
