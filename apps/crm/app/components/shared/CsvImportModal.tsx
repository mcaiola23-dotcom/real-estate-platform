'use client';

import { memo, useState, useCallback, useRef } from 'react';

interface CsvImportModalProps {
  tenantId: string;
  onClose: () => void;
  onImportComplete: (imported: number, errors: number) => void;
}

interface ParsedRow {
  [key: string]: string;
}

const KNOWN_COLUMNS: Record<string, string> = {
  fullname: 'fullName',
  full_name: 'fullName',
  name: 'fullName',
  'contact name': 'fullName',
  contactname: 'fullName',
  email: 'email',
  'email address': 'email',
  emailaddress: 'email',
  phone: 'phone',
  'phone number': 'phone',
  phonenumber: 'phone',
  mobile: 'phone',
  address: 'listingAddress',
  'listing address': 'listingAddress',
  listingaddress: 'listingAddress',
  property: 'listingAddress',
  'property address': 'listingAddress',
  'lead type': 'leadType',
  leadtype: 'leadType',
  type: 'leadType',
  'property type': 'propertyType',
  propertytype: 'propertyType',
  beds: 'beds',
  bedrooms: 'beds',
  baths: 'baths',
  bathrooms: 'baths',
  sqft: 'sqft',
  'square feet': 'sqft',
  squarefeet: 'sqft',
  'price min': 'priceMin',
  pricemin: 'priceMin',
  'min price': 'priceMin',
  'price max': 'priceMax',
  pricemax: 'priceMax',
  'max price': 'priceMax',
  budget: 'priceMax',
  notes: 'notes',
  note: 'notes',
  comments: 'notes',
  source: 'source',
  'lead source': 'source',
  leadsource: 'source',
  timeframe: 'timeframe',
  timeline: 'timeframe',
};

const IMPORT_FIELDS = [
  { value: '', label: '— Skip —' },
  { value: 'fullName', label: 'Full Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'listingAddress', label: 'Listing Address' },
  { value: 'leadType', label: 'Lead Type' },
  { value: 'propertyType', label: 'Property Type' },
  { value: 'beds', label: 'Beds' },
  { value: 'baths', label: 'Baths' },
  { value: 'sqft', label: 'Sqft' },
  { value: 'priceMin', label: 'Price Min' },
  { value: 'priceMax', label: 'Price Max' },
  { value: 'notes', label: 'Notes' },
  { value: 'source', label: 'Source' },
  { value: 'timeframe', label: 'Timeframe' },
];

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]);
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: ParsedRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function autoMapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const normalized = header.toLowerCase().trim();
    if (KNOWN_COLUMNS[normalized]) {
      mapping[header] = KNOWN_COLUMNS[normalized];
    } else {
      mapping[header] = '';
    }
  }
  return mapping;
}

type ImportStep = 'upload' | 'mapping' | 'importing' | 'done';

export const CsvImportModal = memo(function CsvImportModal({
  tenantId,
  onClose,
  onImportComplete,
}: CsvImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState('');
  const [importResult, setImportResult] = useState<{ imported: number; errors: number; errorDetails: { row: number; error: string }[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setParseError('');
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please upload a CSV file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setParseError('File is too large. Maximum 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCsv(text);

      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setParseError('CSV file is empty or has no data rows.');
        return;
      }

      if (parsed.rows.length > 500) {
        setParseError(`CSV has ${parsed.rows.length} rows. Maximum 500 rows per import.`);
        return;
      }

      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setColumnMap(autoMapColumns(parsed.headers));
      setStep('mapping');
    };
    reader.onerror = () => setParseError('Failed to read file.');
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleMapChange = useCallback((header: string, value: string) => {
    setColumnMap((prev) => ({ ...prev, [header]: value }));
  }, []);

  const mappedFieldCount = Object.values(columnMap).filter((v) => v).length;

  const handleImport = useCallback(async () => {
    setImporting(true);
    setStep('importing');

    const importRows = rows.map((row) => {
      const mapped: Record<string, string | number> = {};
      for (const [csvHeader, fieldKey] of Object.entries(columnMap)) {
        if (fieldKey && row[csvHeader]) {
          mapped[fieldKey] = row[csvHeader];
        }
      }
      return mapped;
    });

    try {
      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({ rows: importRows }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        imported: number;
        errors: number;
        errorDetails: { row: number; error: string }[];
        error?: string;
      };

      if (!response.ok) {
        setImportResult({ imported: 0, errors: rows.length, errorDetails: [{ row: 0, error: result.error || 'Import failed.' }] });
      } else {
        setImportResult({ imported: result.imported, errors: result.errors, errorDetails: result.errorDetails || [] });
        onImportComplete(result.imported, result.errors);
      }
    } catch {
      setImportResult({ imported: 0, errors: rows.length, errorDetails: [{ row: 0, error: 'Network error.' }] });
    } finally {
      setImporting(false);
      setStep('done');
    }
  }, [rows, columnMap, tenantId, onImportComplete]);

  const previewRows = rows.slice(0, 5);

  return (
    <div className="crm-modal-overlay" onClick={onClose}>
      <div className="crm-csv-import" onClick={(e) => e.stopPropagation()}>
        <div className="crm-csv-import__header">
          <h3>Import Leads from CSV</h3>
          <button type="button" className="crm-modal-close" onClick={onClose} aria-label="Close import">
            ✕
          </button>
        </div>

        {step === 'upload' && (
          <div className="crm-csv-import__body">
            <div
              className={`crm-csv-import__dropzone ${dragOver ? 'crm-csv-import__dropzone--active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="crm-csv-import__dropzone-icon">📄</div>
              <p className="crm-csv-import__dropzone-text">
                Drag & drop a CSV file here, or click to browse
              </p>
              <span className="crm-muted">Max 500 rows, 5MB</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>

            {parseError && (
              <div className="crm-csv-import__error">{parseError}</div>
            )}

            <div className="crm-csv-import__template">
              <span className="crm-muted">Expected columns:</span>
              <code>Full Name, Email, Phone, Listing Address, Lead Type, Property Type, Beds, Baths, Sqft, Notes, Source</code>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="crm-csv-import__body">
            <p className="crm-csv-import__summary">
              Found <strong>{rows.length}</strong> rows with <strong>{headers.length}</strong> columns.
              Map your CSV columns to lead fields below.
            </p>

            <div className="crm-csv-import__mapping">
              {headers.map((header) => (
                <div key={header} className="crm-csv-import__map-row">
                  <span className="crm-csv-import__csv-col" title={header}>{header}</span>
                  <span className="crm-csv-import__arrow">→</span>
                  <select
                    className="crm-csv-import__field-select"
                    value={columnMap[header] || ''}
                    onChange={(e) => handleMapChange(header, e.target.value)}
                  >
                    {IMPORT_FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {previewRows.length > 0 && (
              <div className="crm-csv-import__preview">
                <h4>Preview (first {previewRows.length} rows)</h4>
                <div className="crm-csv-import__preview-table">
                  <table>
                    <thead>
                      <tr>
                        {headers.filter((h) => columnMap[h]).map((h) => (
                          <th key={h}>{columnMap[h]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i}>
                          {headers.filter((h) => columnMap[h]).map((h) => (
                            <td key={h}>{row[h] || '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="crm-csv-import__actions">
              <button type="button" className="crm-btn crm-btn-ghost" onClick={() => { setStep('upload'); setHeaders([]); setRows([]); }}>
                ← Back
              </button>
              <button
                type="button"
                className="crm-btn crm-btn-primary"
                disabled={mappedFieldCount === 0}
                onClick={() => void handleImport()}
              >
                Import {rows.length} Lead{rows.length !== 1 ? 's' : ''} ({mappedFieldCount} field{mappedFieldCount !== 1 ? 's' : ''} mapped)
              </button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="crm-csv-import__body crm-csv-import__loading">
            <div className="crm-csv-import__spinner" />
            <p>Importing {rows.length} leads...</p>
          </div>
        )}

        {step === 'done' && importResult && (
          <div className="crm-csv-import__body">
            <div className="crm-csv-import__result">
              {importResult.imported > 0 && (
                <div className="crm-csv-import__result-success">
                  {importResult.imported} lead{importResult.imported !== 1 ? 's' : ''} imported successfully
                </div>
              )}
              {importResult.errors > 0 && (
                <div className="crm-csv-import__result-errors">
                  {importResult.errors} row{importResult.errors !== 1 ? 's' : ''} had errors
                  {importResult.errorDetails.length > 0 && (
                    <ul>
                      {importResult.errorDetails.map((err, i) => (
                        <li key={i}>Row {err.row}: {err.error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="crm-csv-import__actions">
              <button type="button" className="crm-btn crm-btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
