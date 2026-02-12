import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'faq',
    title: 'FAQ',
    type: 'document',
    fields: [
        defineField({
            name: 'question',
            title: 'Question',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'answer',
            title: 'Answer',
            type: 'text',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'schemaEnabled',
            title: 'Enable FAQ Schema',
            type: 'boolean',
            initialValue: true,
            description: 'Include this FAQ in structured data markup',
        }),
        defineField({
            name: 'tags',
            title: 'Tags',
            type: 'array',
            of: [{ type: 'string' }],
            options: {
                layout: 'tags',
            },
        }),
    ],
})
