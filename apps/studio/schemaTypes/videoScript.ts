import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'videoScript',
    title: 'Video Script',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'body',
            title: 'Script Body',
            type: 'text',
            rows: 10,
        }),
        defineField({
            name: 'targetRef',
            title: 'Target (Town or Neighborhood)',
            type: 'reference',
            to: [{ type: 'town' }, { type: 'neighborhood' }],
        }),
        defineField({
            name: 'status',
            title: 'Status',
            type: 'string',
            options: {
                list: [
                    { title: 'Draft', value: 'draft' },
                    { title: 'Review', value: 'review' },
                    { title: 'Filming', value: 'filming' },
                    { title: 'Done', value: 'done' },
                ],
            },
        }),
    ],
})
