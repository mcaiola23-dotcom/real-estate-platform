import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'testimonial',
    title: 'Testimonial',
    type: 'document',
    fields: [
        defineField({
            name: 'displayName',
            title: 'Display Name',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'context',
            title: 'Context',
            type: 'string',
            options: {
                list: [
                    { title: 'Buyer', value: 'buyer' },
                    { title: 'Seller', value: 'seller' },
                    { title: 'Investor', value: 'investor' },
                    { title: 'Other', value: 'other' },
                ],
            },
        }),
        defineField({
            name: 'town',
            title: 'Town',
            type: 'reference',
            to: { type: 'town' },
        }),
        defineField({
            name: 'quote',
            title: 'Quote',
            type: 'text',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'approved',
            title: 'Approved',
            type: 'boolean',
            initialValue: false,
        }),
    ],
})
