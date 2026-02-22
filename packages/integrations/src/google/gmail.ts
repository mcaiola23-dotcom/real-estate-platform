import { google } from 'googleapis';
import type { OAuth2Client } from 'googleapis-common';

export interface EmailParams {
  to: string;
  subject: string;
  body: string;
  replyToMessageId?: string;
}

export interface SentEmail {
  messageId: string;
  threadId: string;
}

export interface EmailThread {
  id: string;
  snippet: string;
  subject: string;
  lastMessageDate: Date;
  messageCount: number;
  isUnread: boolean;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: Date;
  body: string;
  isHtml: boolean;
}

/**
 * Build an RFC 2822 formatted MIME message for the Gmail API.
 */
function buildRfc2822Message(params: EmailParams): string {
  const lines = [
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
  ];

  if (params.replyToMessageId) {
    lines.push(`In-Reply-To: ${params.replyToMessageId}`);
    lines.push(`References: ${params.replyToMessageId}`);
  }

  lines.push('', params.body);
  return lines.join('\r\n');
}

function toBase64Url(str: string): string {
  return Buffer.from(str).toString('base64url');
}

export async function sendEmail(
  client: OAuth2Client,
  params: EmailParams
): Promise<SentEmail> {
  const gmail = google.gmail({ version: 'v1', auth: client });
  const raw = toBase64Url(buildRfc2822Message(params));

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw, threadId: params.replyToMessageId ? undefined : undefined },
  });

  return {
    messageId: response.data.id ?? '',
    threadId: response.data.threadId ?? '',
  };
}

export async function createDraft(
  client: OAuth2Client,
  params: Omit<EmailParams, 'replyToMessageId'>
): Promise<{ draftId: string; messageId: string }> {
  const gmail = google.gmail({ version: 'v1', auth: client });
  const raw = toBase64Url(buildRfc2822Message(params));

  const response = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: { message: { raw } },
  });

  return {
    draftId: response.data.id ?? '',
    messageId: response.data.message?.id ?? '',
  };
}

export async function listThreads(
  client: OAuth2Client,
  options: { query?: string; maxResults?: number }
): Promise<EmailThread[]> {
  const gmail = google.gmail({ version: 'v1', auth: client });
  const response = await gmail.users.threads.list({
    userId: 'me',
    q: options.query,
    maxResults: options.maxResults ?? 20,
  });

  const threads = response.data.threads ?? [];
  const results: EmailThread[] = [];

  for (const thread of threads) {
    if (!thread.id) continue;
    const detail = await gmail.users.threads.get({
      userId: 'me',
      id: thread.id,
      format: 'metadata',
      metadataHeaders: ['Subject', 'Date'],
    });

    const messages = detail.data.messages ?? [];
    const lastMessage = messages[messages.length - 1];
    const headers = lastMessage?.payload?.headers ?? [];
    const subject = headers.find((h) => h.name === 'Subject')?.value ?? '(no subject)';
    const dateStr = headers.find((h) => h.name === 'Date')?.value;
    const isUnread = messages.some((m) => m.labelIds?.includes('UNREAD'));

    results.push({
      id: thread.id,
      snippet: thread.snippet ?? '',
      subject,
      lastMessageDate: dateStr ? new Date(dateStr) : new Date(),
      messageCount: messages.length,
      isUnread,
    });
  }

  return results;
}

export async function getThread(
  client: OAuth2Client,
  threadId: string
): Promise<EmailMessage[]> {
  const gmail = google.gmail({ version: 'v1', auth: client });
  const response = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'full',
  });

  const messages = response.data.messages ?? [];
  return messages.map((msg) => {
    const headers = msg.payload?.headers ?? [];
    const from = headers.find((h) => h.name === 'From')?.value ?? '';
    const to = headers.find((h) => h.name === 'To')?.value ?? '';
    const subject = headers.find((h) => h.name === 'Subject')?.value ?? '';
    const dateStr = headers.find((h) => h.name === 'Date')?.value;
    const body = parseMessageBody(msg.payload);

    return {
      id: msg.id ?? '',
      threadId: msg.threadId ?? '',
      from,
      to,
      subject,
      date: dateStr ? new Date(dateStr) : new Date(),
      body: body.content,
      isHtml: body.isHtml,
    };
  });
}

/**
 * Recursively extract the message body from MIME parts.
 * Prefers text/html, falls back to text/plain.
 */
export function parseMessageBody(
  payload: any
): { content: string; isHtml: boolean } {
  if (!payload) return { content: '', isHtml: false };

  // Direct body data
  if (payload.body?.data) {
    const decoded = Buffer.from(payload.body.data, 'base64url').toString('utf8');
    return {
      content: decoded,
      isHtml: payload.mimeType === 'text/html',
    };
  }

  // Multipart: search parts recursively
  const parts = payload.parts ?? [];
  let htmlPart: string | null = null;
  let textPart: string | null = null;

  for (const part of parts) {
    if (part.mimeType === 'text/html' && part.body?.data) {
      htmlPart = Buffer.from(part.body.data, 'base64url').toString('utf8');
    } else if (part.mimeType === 'text/plain' && part.body?.data) {
      textPart = Buffer.from(part.body.data, 'base64url').toString('utf8');
    } else if (part.parts) {
      const nested = parseMessageBody(part);
      if (nested.isHtml && !htmlPart) htmlPart = nested.content;
      else if (!nested.isHtml && !textPart) textPart = nested.content;
    }
  }

  if (htmlPart) return { content: htmlPart, isHtml: true };
  if (textPart) return { content: textPart, isHtml: false };
  return { content: '', isHtml: false };
}
