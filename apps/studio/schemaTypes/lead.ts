import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'lead',
    title: 'Lead',
    type: 'document',
    fields: [
        defineField({
            name: 'createdAt',
            title: 'Created At',
            type: 'datetime',
            initialValue: () => new Date().toISOString(),
            readOnly: true,
        }),
        defineField({
            name: 'source',
            title: 'Source',
            type: 'string',
            options: {
                list: [
                    { title: 'Contact Form', value: 'contact' },
                    { title: 'Listing Inquiry', value: 'listing-inquiry' },
                    { title: 'Unknown', value: 'unknown' },
                ],
            },
            initialValue: 'unknown',
        }),
        defineField({
            name: 'listingId',
            title: 'Listing ID',
            type: 'string',
            hidden: ({ document }) => document?.source !== 'listing-inquiry',
        }),
        defineField({
            name: 'listingUrl',
            title: 'Listing URL',
            type: 'string',
            hidden: ({ document }) => document?.source !== 'listing-inquiry',
        }),
        defineField({
            name: 'fullName',
            title: 'Full Name',
            type: 'string',
        }),
        defineField({
            name: 'email',
            title: 'Email',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'phone',
            title: 'Phone',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'address',
            title: 'Address',
            type: 'string',
        }),
        defineField({
            name: 'propertyType',
            title: 'Property Type',
            type: 'string',
        }),
        defineField({
            name: 'beds',
            title: 'Beds',
            type: 'number',
            hidden: ({ document }) => document?.source === 'listing-inquiry',
        }),
        defineField({
            name: 'baths',
            title: 'Baths',
            type: 'number',
            hidden: ({ document }) => document?.source === 'listing-inquiry',
        }),
        defineField({
            name: 'sqft',
            title: 'Sqft',
            type: 'number',
            hidden: ({ document }) => document?.source === 'listing-inquiry',
        }),
        defineField({
            name: 'timeframe',
            title: 'Timeframe',
            type: 'string',
        }),
        defineField({
            name: 'notes',
            title: 'Notes',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'consentToContact',
            title: 'Consent to Contact',
            type: 'boolean',
            initialValue: true,
        }),
        defineField({
            name: 'ip',
            title: 'IP Address',
            type: 'string',
            readOnly: true,
        }),
        defineField({
            name: 'userAgent',
            title: 'User Agent',
            type: 'string',
            readOnly: true,
        }),
    ],
    preview: {
        select: {
            title: 'fullName',
            subtitle: 'email',
            date: 'createdAt',
            source: 'source',
        },
        prepare({ title, subtitle, date, source }) {
            return {
                title: title || 'No Name',
                subtitle: `${new Date(date).toLocaleDateString()} - ${source} - ${subtitle || 'No Email'}`,
            }
        },
    },
})
