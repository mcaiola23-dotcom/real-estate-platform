/**
 * ICS calendar file generation for CRM follow-up reminders.
 * Pure client-side — generates .ics content and triggers download.
 */

interface IcsEventParams {
  title: string;
  startDate: Date;
  durationMinutes?: number;
  description?: string;
  location?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIcsDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function generateUid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}@crm`;
}

export function generateIcsContent(params: IcsEventParams): string {
  const { title, startDate, durationMinutes = 30, description, location } = params;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Real Estate CRM//Follow-Up//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${generateUid()}`,
    `DTSTART:${toIcsDate(startDate)}`,
    `DTEND:${toIcsDate(endDate)}`,
    `SUMMARY:${escapeIcsText(title)}`,
  ];

  if (description) {
    lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
  }
  if (location) {
    lines.push(`LOCATION:${escapeIcsText(location)}`);
  }

  lines.push(
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  );

  return lines.join('\r\n');
}

export function downloadIcsFile(params: IcsEventParams): void {
  const content = generateIcsContent(params);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${params.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
