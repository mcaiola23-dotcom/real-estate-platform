/* eslint-disable @next/next/no-img-element */

// ---------------------------------------------------------------------------
// Client Portal — Read-Only Public Page
// ---------------------------------------------------------------------------
// This server component renders a shareable, read-only view of a lead's
// listing details, showing schedule, and transaction status. No authentication
// is required; the signed HMAC token in the URL serves as authorization.
// ---------------------------------------------------------------------------

interface PortalLead {
  id: string;
  status: string;
  listingAddress: string | null;
  propertyType: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  priceMin: number | null;
  priceMax: number | null;
  timeframe: string | null;
}

interface PortalContact {
  fullName: string | null;
  email: string | null;
  phone: string | null;
}

interface PortalShowing {
  id: string;
  propertyAddress: string;
  scheduledAt: string;
  duration: number | null;
  status: string;
  notes: string | null;
}

interface PortalTransaction {
  id: string;
  propertyAddress: string;
  status: string;
  side: string;
  salePrice: number | null;
  listPrice: number | null;
  closingDate: string | null;
  contractDate: string | null;
}

interface PortalData {
  ok: boolean;
  error?: string;
  portal?: {
    lead: PortalLead;
    contact: PortalContact | null;
    showings: PortalShowing[];
    transactions: PortalTransaction[];
  };
}

interface PageProps {
  params: Promise<{ token: string }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number | null): string {
  if (value == null) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string | null): string {
  if (!iso) return '--';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '--';
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    new: 'New',
    qualified: 'Qualified',
    nurturing: 'Nurturing',
    won: 'Won',
    lost: 'Lost',
    under_contract: 'Under Contract',
    inspection: 'Inspection',
    appraisal: 'Appraisal',
    title: 'Title',
    closing: 'Closing',
    closed: 'Closed',
    fallen_through: 'Fallen Through',
    scheduled: 'Scheduled',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  return map[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    new: '#3b82f6',
    qualified: '#8b5cf6',
    nurturing: '#f59e0b',
    won: '#10b981',
    lost: '#ef4444',
    under_contract: '#3b82f6',
    inspection: '#f59e0b',
    appraisal: '#8b5cf6',
    title: '#6366f1',
    closing: '#f97316',
    closed: '#10b981',
    fallen_through: '#ef4444',
    scheduled: '#3b82f6',
    completed: '#10b981',
    cancelled: '#6b7280',
    no_show: '#ef4444',
  };
  return colors[status] || '#6b7280';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default async function PortalPage({ params }: PageProps) {
  const { token } = await params;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
  let data: PortalData;

  try {
    const res = await fetch(`${baseUrl}/api/portal/${token}`, {
      cache: 'no-store',
    });
    data = (await res.json()) as PortalData;
  } catch {
    data = { ok: false, error: 'Unable to load portal data.' };
  }

  if (!data.ok || !data.portal) {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Client Portal</title>
        </head>
        <body style={styles.body}>
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </div>
            <h1 style={styles.errorTitle}>Invalid or Expired Link</h1>
            <p style={styles.errorText}>
              This portal link is no longer valid. Please contact your agent for a new link.
            </p>
          </div>
        </body>
      </html>
    );
  }

  const { lead, contact, showings, transactions } = data.portal;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>
          {lead.listingAddress ? `Portal - ${lead.listingAddress}` : 'Client Portal'}
        </title>
      </head>
      <body style={styles.body}>
        <div style={styles.container}>
          {/* Header */}
          <header style={styles.header}>
            <h1 style={styles.headerTitle}>Client Portal</h1>
            <p style={styles.headerSubtitle}>
              Your personalized property dashboard
            </p>
          </header>

          {/* Agent Contact Card */}
          {contact && (
            <section style={styles.card}>
              <h2 style={styles.cardTitle}>Your Agent</h2>
              <div style={styles.agentInfo}>
                <div style={styles.agentAvatar}>
                  {(contact.fullName || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={styles.agentName}>{contact.fullName || 'Your Agent'}</p>
                  {contact.email && (
                    <p style={styles.agentDetail}>
                      <span style={styles.detailLabel}>Email:</span>{' '}
                      <a href={`mailto:${contact.email}`} style={styles.link}>
                        {contact.email}
                      </a>
                    </p>
                  )}
                  {contact.phone && (
                    <p style={styles.agentDetail}>
                      <span style={styles.detailLabel}>Phone:</span>{' '}
                      <a href={`tel:${contact.phone}`} style={styles.link}>
                        {contact.phone}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Listing Details */}
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Listing Details</h2>
              <span
                style={{
                  ...styles.badge,
                  backgroundColor: statusColor(lead.status) + '18',
                  color: statusColor(lead.status),
                  borderColor: statusColor(lead.status) + '40',
                }}
              >
                {statusLabel(lead.status)}
              </span>
            </div>

            {lead.listingAddress && (
              <p style={styles.address}>{lead.listingAddress}</p>
            )}

            <div style={styles.detailGrid}>
              {lead.propertyType && (
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Type</span>
                  <span style={styles.detailValue}>{lead.propertyType}</span>
                </div>
              )}
              {lead.beds != null && (
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Beds</span>
                  <span style={styles.detailValue}>{lead.beds}</span>
                </div>
              )}
              {lead.baths != null && (
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Baths</span>
                  <span style={styles.detailValue}>{lead.baths}</span>
                </div>
              )}
              {lead.sqft != null && (
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Sq Ft</span>
                  <span style={styles.detailValue}>{lead.sqft.toLocaleString()}</span>
                </div>
              )}
              {(lead.priceMin != null || lead.priceMax != null) && (
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Price Range</span>
                  <span style={styles.detailValue}>
                    {formatCurrency(lead.priceMin)} - {formatCurrency(lead.priceMax)}
                  </span>
                </div>
              )}
              {lead.timeframe && (
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Timeframe</span>
                  <span style={styles.detailValue}>{lead.timeframe}</span>
                </div>
              )}
            </div>
          </section>

          {/* Showing Schedule */}
          {showings.length > 0 && (
            <section style={styles.card}>
              <h2 style={styles.cardTitle}>Showing Schedule</h2>
              <div style={styles.showingsList}>
                {showings.map((showing) => (
                  <div key={showing.id} style={styles.showingItem}>
                    <div style={styles.showingHeader}>
                      <div>
                        <p style={styles.showingAddress}>{showing.propertyAddress}</p>
                        <p style={styles.showingDate}>
                          {formatDateTime(showing.scheduledAt)}
                          {showing.duration ? ` (${showing.duration} min)` : ''}
                        </p>
                      </div>
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor: statusColor(showing.status) + '18',
                          color: statusColor(showing.status),
                          borderColor: statusColor(showing.status) + '40',
                        }}
                      >
                        {statusLabel(showing.status)}
                      </span>
                    </div>
                    {showing.notes && (
                      <p style={styles.showingNotes}>{showing.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Transaction Status */}
          {transactions.length > 0 && (
            <section style={styles.card}>
              <h2 style={styles.cardTitle}>Transaction Status</h2>
              <div style={styles.transactionList}>
                {transactions.map((tx) => (
                  <div key={tx.id} style={styles.transactionItem}>
                    <div style={styles.transactionHeader}>
                      <p style={styles.transactionAddress}>{tx.propertyAddress}</p>
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor: statusColor(tx.status) + '18',
                          color: statusColor(tx.status),
                          borderColor: statusColor(tx.status) + '40',
                        }}
                      >
                        {statusLabel(tx.status)}
                      </span>
                    </div>
                    <div style={styles.transactionDetails}>
                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>Side</span>
                        <span style={styles.detailValue}>
                          {tx.side.charAt(0).toUpperCase() + tx.side.slice(1)}
                        </span>
                      </div>
                      {tx.listPrice != null && (
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>List Price</span>
                          <span style={styles.detailValue}>{formatCurrency(tx.listPrice)}</span>
                        </div>
                      )}
                      {tx.salePrice != null && (
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Sale Price</span>
                          <span style={styles.detailValue}>{formatCurrency(tx.salePrice)}</span>
                        </div>
                      )}
                      {tx.contractDate && (
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Contract Date</span>
                          <span style={styles.detailValue}>{formatDate(tx.contractDate)}</span>
                        </div>
                      )}
                      {tx.closingDate && (
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Closing Date</span>
                          <span style={styles.detailValue}>{formatDate(tx.closingDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Footer */}
          <footer style={styles.footer}>
            <p style={styles.footerText}>
              This is a secure, read-only view generated for you. Link expires after 7 days.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}

// ---------------------------------------------------------------------------
// Styles — inline for self-contained portal page
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    padding: 0,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#f8f9fa',
    color: '#1a1a1a',
    lineHeight: 1.6,
  },
  container: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '24px 16px',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: '1px solid #e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 4px 0',
    letterSpacing: '-0.02em',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    margin: 0,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: '24px',
    marginBottom: 20,
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  badge: {
    display: 'inline-block',
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 9999,
    border: '1px solid',
    letterSpacing: '0.02em',
    textTransform: 'capitalize' as const,
  },
  agentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  agentAvatar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    fontWeight: 700,
    flexShrink: 0,
  },
  agentName: {
    fontSize: 16,
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 4px 0',
  },
  agentDetail: {
    fontSize: 14,
    color: '#4b5563',
    margin: '2px 0',
  },
  link: {
    color: '#4338ca',
    textDecoration: 'none',
  },
  address: {
    fontSize: 20,
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 16px 0',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 16,
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: 500,
    color: '#111827',
  },
  showingsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    marginTop: 12,
  },
  showingItem: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    border: '1px solid #f3f4f6',
  },
  showingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap' as const,
  },
  showingAddress: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  showingDate: {
    fontSize: 13,
    color: '#4b5563',
    margin: '4px 0 0 0',
  },
  showingNotes: {
    fontSize: 13,
    color: '#6b7280',
    margin: '8px 0 0 0',
    fontStyle: 'italic' as const,
  },
  transactionList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
    marginTop: 12,
  },
  transactionItem: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    border: '1px solid #f3f4f6',
  },
  transactionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap' as const,
    marginBottom: 12,
  },
  transactionAddress: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  transactionDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 12,
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: 32,
    paddingTop: 20,
    borderTop: '1px solid #e5e7eb',
  },
  footerText: {
    fontSize: 13,
    color: '#9ca3af',
    margin: 0,
  },
  errorContainer: {
    maxWidth: 480,
    margin: '120px auto',
    textAlign: 'center' as const,
    padding: '0 24px',
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: '#374151',
    margin: '0 0 8px 0',
  },
  errorText: {
    fontSize: 15,
    color: '#6b7280',
    margin: 0,
    lineHeight: 1.6,
  },
};
