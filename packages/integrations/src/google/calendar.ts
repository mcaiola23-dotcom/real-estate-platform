import { google } from 'googleapis';
import type { OAuth2Client } from 'googleapis-common';

export interface CalendarEventInput {
  summary: string;
  description?: string;
  startTime: Date;
  durationMinutes?: number;
  reminders?: { minutes: number }[];
  crmLeadId?: string;
  crmActionId?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  htmlLink?: string;
  isCrmEvent: boolean;
  crmLeadId?: string;
  crmActionId?: string;
}

function toCalendarEvent(event: any): CalendarEvent {
  const privateProps = event.extendedProperties?.private ?? {};
  return {
    id: event.id,
    summary: event.summary ?? '',
    description: event.description ?? undefined,
    start: new Date(event.start?.dateTime ?? event.start?.date),
    end: new Date(event.end?.dateTime ?? event.end?.date),
    htmlLink: event.htmlLink ?? undefined,
    isCrmEvent: privateProps.crmSource === 'real-estate-crm',
    crmLeadId: privateProps.crmLeadId ?? undefined,
    crmActionId: privateProps.crmActionId ?? undefined,
  };
}

export async function listCalendarEvents(
  client: OAuth2Client,
  timeMin: Date,
  timeMax: Date
): Promise<CalendarEvent[]> {
  const calendar = google.calendar({ version: 'v3', auth: client });
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  });

  return (response.data.items ?? []).map(toCalendarEvent);
}

export async function createCalendarEvent(
  client: OAuth2Client,
  event: CalendarEventInput
): Promise<CalendarEvent> {
  const calendar = google.calendar({ version: 'v3', auth: client });
  const duration = event.durationMinutes ?? 30;
  const endTime = new Date(event.startTime.getTime() + duration * 60 * 1000);

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      reminders: {
        useDefault: false,
        overrides: (event.reminders ?? [{ minutes: 15 }]).map((r) => ({
          method: 'popup' as const,
          minutes: r.minutes,
        })),
      },
      extendedProperties: {
        private: {
          crmSource: 'real-estate-crm',
          ...(event.crmLeadId ? { crmLeadId: event.crmLeadId } : {}),
          ...(event.crmActionId ? { crmActionId: event.crmActionId } : {}),
        },
      },
    },
  });

  return toCalendarEvent(response.data);
}

export async function updateCalendarEvent(
  client: OAuth2Client,
  eventId: string,
  updates: Partial<CalendarEventInput>
): Promise<CalendarEvent> {
  const calendar = google.calendar({ version: 'v3', auth: client });
  const endTime =
    updates.startTime && updates.durationMinutes
      ? new Date(updates.startTime.getTime() + updates.durationMinutes * 60 * 1000)
      : undefined;

  const requestBody: Record<string, any> = {};
  if (updates.summary !== undefined) requestBody.summary = updates.summary;
  if (updates.description !== undefined) requestBody.description = updates.description;
  if (updates.startTime) requestBody.start = { dateTime: updates.startTime.toISOString() };
  if (endTime) requestBody.end = { dateTime: endTime.toISOString() };

  const response = await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody,
  });

  return toCalendarEvent(response.data);
}

export async function deleteCalendarEvent(
  client: OAuth2Client,
  eventId: string
): Promise<void> {
  const calendar = google.calendar({ version: 'v3', auth: client });
  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });
}

/**
 * Find a CRM-created calendar event by lead ID.
 * Uses privateExtendedProperty filter to query efficiently.
 */
export async function findCrmEvent(
  client: OAuth2Client,
  crmLeadId: string,
  crmActionId?: string
): Promise<CalendarEvent | null> {
  const calendar = google.calendar({ version: 'v3', auth: client });
  const response = await calendar.events.list({
    calendarId: 'primary',
    privateExtendedProperty: [`crmLeadId=${crmLeadId}`],
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 10,
  });

  const events = (response.data.items ?? []).map(toCalendarEvent);

  if (crmActionId) {
    return events.find((e) => e.crmActionId === crmActionId) ?? null;
  }

  return events[0] ?? null;
}
