/**
 * Client-side CSV export for CRM data.
 * Generates a CSV Blob and triggers download.
 */

function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCsvField).join(',');
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(','));
  return [headerLine, ...dataLines].join('\r\n');
}

function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

import type { CrmLead, CrmContact } from '@real-estate/types/crm';

export function exportLeadsCsv(
  leads: CrmLead[],
  contactById: Map<string, CrmContact>
): void {
  const headers = [
    'Name', 'Status', 'Type', 'Source', 'Listing Address',
    'Price Min', 'Price Max', 'Email', 'Phone', 'Last Contact', 'Next Action', 'Created',
  ];

  const rows = leads.map((lead) => {
    const contact = lead.contactId ? contactById.get(lead.contactId) : undefined;
    return [
      contact?.fullName || lead.listingAddress || '',
      lead.status,
      lead.leadType,
      lead.source,
      lead.listingAddress,
      lead.priceMin,
      lead.priceMax,
      contact?.email,
      contact?.phone,
      lead.lastContactAt,
      lead.nextActionAt,
      lead.createdAt,
    ];
  });

  const csv = toCsv(headers, rows);
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(csv, `crm-leads-${date}.csv`);
}

export function exportContactsCsv(contacts: CrmContact[]): void {
  const headers = ['Name', 'Email', 'Phone', 'Created'];
  const rows = contacts.map((c) => [c.fullName, c.email, c.phone, c.createdAt]);
  const csv = toCsv(headers, rows);
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(csv, `crm-contacts-${date}.csv`);
}
