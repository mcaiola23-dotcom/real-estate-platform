/**
 * Pre-built message templates with merge field support for CRM outreach.
 *
 * Templates support merge fields like {{lead.name}}, {{agent.name}}, {{property.address}}
 * which are resolved at render time from lead/contact/agent context.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TemplateCategory = 'outreach' | 'follow_up' | 'listing' | 'transaction' | 'general';
export type TemplateChannel = 'email' | 'sms';

export interface MessageTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  channel: TemplateChannel;
  subject: string | null; // null for SMS
  body: string;
  description: string;
  mergeFields: string[];
}

export interface MergeFieldContext {
  leadName: string | null;
  agentName: string | null;
  propertyAddress: string | null;
  propertyType: string | null;
  priceRange: string | null;
  timeframe: string | null;
  agentPhone: string | null;
  agentEmail: string | null;
}

// ---------------------------------------------------------------------------
// Merge field resolution
// ---------------------------------------------------------------------------

const MERGE_FIELD_MAP: Record<string, (ctx: MergeFieldContext) => string> = {
  '{{lead.name}}': (ctx) => ctx.leadName || 'there',
  '{{agent.name}}': (ctx) => ctx.agentName || 'Your Agent',
  '{{property.address}}': (ctx) => ctx.propertyAddress || 'the property',
  '{{property.type}}': (ctx) => ctx.propertyType || 'property',
  '{{price.range}}': (ctx) => ctx.priceRange || 'your budget range',
  '{{timeframe}}': (ctx) => ctx.timeframe || 'your timeline',
  '{{agent.phone}}': (ctx) => ctx.agentPhone || '',
  '{{agent.email}}': (ctx) => ctx.agentEmail || '',
};

export function resolveMergeFields(text: string, ctx: MergeFieldContext): string {
  let result = text;
  for (const [field, resolver] of Object.entries(MERGE_FIELD_MAP)) {
    result = result.replaceAll(field, resolver(ctx));
  }
  return result;
}

export function extractMergeFields(text: string): string[] {
  const matches = text.match(/\{\{[^}]+\}\}/g);
  return matches ? [...new Set(matches)] : [];
}

// ---------------------------------------------------------------------------
// Pre-built templates
// ---------------------------------------------------------------------------

export const BUILT_IN_TEMPLATES: MessageTemplate[] = [
  {
    id: 'initial_outreach_email',
    name: 'Initial Outreach',
    category: 'outreach',
    channel: 'email',
    subject: 'Great to connect — let me help with your property search',
    body: `Hello {{lead.name}},

Thank you for your interest! I noticed you've been exploring properties and I'd love to help you find the perfect home.

Whether you're just starting to look or ready to make a move, I'm here to answer any questions and provide local market insights.

Would you be available for a quick call this week to discuss what you're looking for?

Best regards,
{{agent.name}}`,
    description: 'First contact with a new lead from the website.',
    mergeFields: ['{{lead.name}}', '{{agent.name}}'],
  },
  {
    id: 'follow_up_email',
    name: 'Follow-Up Check-In',
    category: 'follow_up',
    channel: 'email',
    subject: 'Checking in on your home search',
    body: `Hi {{lead.name}},

I wanted to check in and see how your property search is going. I've been keeping an eye on the market and have some updates that might interest you.

If your needs have changed or you'd like to discuss new options, I'm happy to set up a time to chat.

Looking forward to hearing from you!

Warm regards,
{{agent.name}}`,
    description: 'Gentle follow-up for leads who haven\'t responded.',
    mergeFields: ['{{lead.name}}', '{{agent.name}}'],
  },
  {
    id: 'price_update_email',
    name: 'Price Update Alert',
    category: 'listing',
    channel: 'email',
    subject: 'Price update on {{property.address}}',
    body: `Hi {{lead.name}},

I wanted to let you know that there's been a price change on {{property.address}}. This could be a great opportunity given {{price.range}}.

Would you like me to schedule a showing or provide more details about this property?

Best,
{{agent.name}}`,
    description: 'Notify a lead about a price change on a property of interest.',
    mergeFields: ['{{lead.name}}', '{{property.address}}', '{{price.range}}', '{{agent.name}}'],
  },
  {
    id: 'open_house_email',
    name: 'Open House Invitation',
    category: 'listing',
    channel: 'email',
    subject: 'You\'re invited — Open House at {{property.address}}',
    body: `Hi {{lead.name}},

I'd love to invite you to an upcoming open house at {{property.address}}. Based on what you've been looking for, I think this {{property.type}} could be a great match.

Feel free to stop by, or let me know if you'd like a private showing at a time that works better for you.

Hope to see you there!
{{agent.name}}`,
    description: 'Invite a lead to an open house event.',
    mergeFields: ['{{lead.name}}', '{{property.address}}', '{{property.type}}', '{{agent.name}}'],
  },
  {
    id: 'listing_alert_email',
    name: 'New Listing Alert',
    category: 'listing',
    channel: 'email',
    subject: 'New listing that matches your criteria',
    body: `Hi {{lead.name}},

A new {{property.type}} just hit the market that I think you'll want to see! It's located at {{property.address}} and falls within {{price.range}}.

Given {{timeframe}}, this could be worth a look. Want me to set up a showing?

Let me know!
{{agent.name}}`,
    description: 'Alert a lead about a new listing matching their criteria.',
    mergeFields: ['{{lead.name}}', '{{property.type}}', '{{property.address}}', '{{price.range}}', '{{timeframe}}', '{{agent.name}}'],
  },
  {
    id: 'under_contract_email',
    name: 'Under Contract Update',
    category: 'transaction',
    channel: 'email',
    subject: 'Great news — {{property.address}} is under contract!',
    body: `Hi {{lead.name}},

Exciting news! We've successfully gone under contract on {{property.address}}. Here's what happens next:

1. Home inspection will be scheduled shortly
2. Appraisal process will begin
3. I'll keep you updated on every milestone

If you have any questions about the process, don't hesitate to reach out.

Congratulations!
{{agent.name}}`,
    description: 'Update a buyer that their offer has been accepted.',
    mergeFields: ['{{lead.name}}', '{{property.address}}', '{{agent.name}}'],
  },
  {
    id: 'closing_congrats_email',
    name: 'Closing Congratulations',
    category: 'transaction',
    channel: 'email',
    subject: 'Congratulations on your new home!',
    body: `Dear {{lead.name}},

Congratulations on closing on {{property.address}}! It's been a pleasure working with you through this process.

If you ever need anything — whether it's a contractor recommendation, market update, or just have questions about homeownership — please don't hesitate to reach out.

I'd also appreciate any referrals if you know anyone looking to buy or sell. Wishing you all the best in your new home!

Warm regards,
{{agent.name}}`,
    description: 'Congratulate a buyer on closing.',
    mergeFields: ['{{lead.name}}', '{{property.address}}', '{{agent.name}}'],
  },
  // SMS templates
  {
    id: 'quick_follow_up_sms',
    name: 'Quick Follow-Up',
    category: 'follow_up',
    channel: 'sms',
    subject: null,
    body: `Hi {{lead.name}}, it's {{agent.name}}. Just checking in on your home search — any questions I can help with? Feel free to call or text anytime.`,
    description: 'Brief SMS check-in for active leads.',
    mergeFields: ['{{lead.name}}', '{{agent.name}}'],
  },
  {
    id: 'showing_reminder_sms',
    name: 'Showing Reminder',
    category: 'listing',
    channel: 'sms',
    subject: null,
    body: `Hi {{lead.name}}, this is {{agent.name}} — just a reminder about the showing at {{property.address}}. Looking forward to seeing you! Let me know if anything changes.`,
    description: 'Remind a lead about an upcoming property showing.',
    mergeFields: ['{{lead.name}}', '{{agent.name}}', '{{property.address}}'],
  },
];

// ---------------------------------------------------------------------------
// Template helpers
// ---------------------------------------------------------------------------

export function getTemplateById(id: string): MessageTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: TemplateCategory): MessageTemplate[] {
  return BUILT_IN_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplatesByChannel(channel: TemplateChannel): MessageTemplate[] {
  return BUILT_IN_TEMPLATES.filter((t) => t.channel === channel);
}
