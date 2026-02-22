/**
 * CRM Export Utilities — client-side CSV and print-ready export helpers.
 */

import type { CrmLead, CrmActivity, CrmContact } from '@real-estate/types/crm';

// ── CSV Generation ──────────────────────────────────────────

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsvRow(fields: string[]): string {
  return fields.map(escapeCsvField).join(',');
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportLeadsCsv(
  leads: CrmLead[],
  contacts: Map<string, CrmContact>,
  filename = 'leads-export.csv'
): void {
  const headers = [
    'Name', 'Email', 'Phone', 'Status', 'Lead Type', 'Source',
    'Property Address', 'Property Type', 'Beds', 'Baths', 'Sqft',
    'Price Min', 'Price Max', 'Timeframe', 'Notes', 'Tags',
    'Created', 'Updated',
  ];

  const rows = leads.map((lead) => {
    const contact = lead.contactId ? contacts.get(lead.contactId) : undefined;
    const tags = (lead.tags ?? []).join('; ');
    return toCsvRow([
      contact?.fullName || '',
      contact?.email || '',
      contact?.phone || '',
      lead.status,
      lead.leadType,
      lead.source,
      lead.listingAddress || '',
      lead.propertyType || '',
      lead.beds?.toString() || '',
      lead.baths?.toString() || '',
      lead.sqft?.toString() || '',
      lead.priceMin?.toString() || '',
      lead.priceMax?.toString() || '',
      lead.timeframe || '',
      lead.notes || '',
      tags,
      lead.createdAt,
      lead.updatedAt,
    ]);
  });

  const csv = [toCsvRow(headers), ...rows].join('\n');
  downloadBlob(csv, filename, 'text/csv;charset=utf-8;');
}

export function exportActivitiesCsv(
  activities: CrmActivity[],
  filename = 'activities-export.csv'
): void {
  const headers = ['Date', 'Type', 'Summary', 'Lead ID', 'Contact ID'];

  const rows = activities.map((a) =>
    toCsvRow([
      a.occurredAt,
      a.activityType,
      a.summary,
      a.leadId || '',
      a.contactId || '',
    ])
  );

  const csv = [toCsvRow(headers), ...rows].join('\n');
  downloadBlob(csv, filename, 'text/csv;charset=utf-8;');
}

export function exportContactsCsv(
  contacts: CrmContact[],
  filename = 'contacts-export.csv'
): void {
  const headers = ['Name', 'Email', 'Phone', 'Source', 'Created'];

  const rows = contacts.map((c) =>
    toCsvRow([
      c.fullName || '',
      c.email || '',
      c.phone || '',
      c.source,
      c.createdAt,
    ])
  );

  const csv = [toCsvRow(headers), ...rows].join('\n');
  downloadBlob(csv, filename, 'text/csv;charset=utf-8;');
}

// ── Print / PDF ─────────────────────────────────────────────

export interface PipelineSnapshot {
  statusCounts: Record<string, number>;
  totalValue: number;
  avgDaysInPipeline: number;
}

export function printPipelineReport(
  snapshot: PipelineSnapshot,
  brandName: string
): void {
  const win = window.open('', '_blank');
  if (!win) return;

  const statusRows = Object.entries(snapshot.statusCounts)
    .map(([status, count]) => `<tr><td>${status}</td><td>${count}</td></tr>`)
    .join('');

  win.document.write(`<!DOCTYPE html>
<html><head><title>Pipeline Report — ${brandName}</title>
<style>
  body { font-family: 'Inter', system-ui, sans-serif; max-width: 700px; margin: 2rem auto; color: #333; }
  h1 { font-family: Georgia, serif; font-size: 1.5rem; border-bottom: 2px solid #8b7355; padding-bottom: 0.5rem; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
  th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e3df; }
  th { background: #f8f7f5; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em; }
  .metric { display: inline-block; background: #f8f7f5; border: 1px solid #e5e3df; border-radius: 8px; padding: 0.75rem 1.25rem; margin: 0.25rem; text-align: center; }
  .metric strong { display: block; font-size: 1.5rem; color: #8b7355; }
  .metric span { font-size: 0.75rem; color: #888; text-transform: uppercase; }
  .footer { margin-top: 2rem; font-size: 0.75rem; color: #999; border-top: 1px solid #e5e3df; padding-top: 0.5rem; }
  @media print { body { margin: 0; } }
</style></head><body>
<h1>${brandName} — Pipeline Report</h1>
<p style="color:#666">Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
<div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin:1rem 0">
  <div class="metric"><strong>$${(snapshot.totalValue / 1000).toFixed(0)}K</strong><span>Pipeline Value</span></div>
  <div class="metric"><strong>${snapshot.avgDaysInPipeline}</strong><span>Avg Days in Pipeline</span></div>
</div>
<table><thead><tr><th>Status</th><th>Count</th></tr></thead><tbody>${statusRows}</tbody></table>
<div class="footer">Confidential — ${brandName} CRM</div>
</body></html>`);

  win.document.close();
  win.print();
}
