import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'town',
    title: 'Town',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'name',
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'center',
            title: 'Center Coordinates',
            description: 'Representative lat/lng for the town (e.g., town hall/downtown). Used for geo-based data modules.',
            type: 'geopoint',
        }),
        defineField({
            name: 'overviewShort',
            title: 'Short Overview',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'heroImage',
            title: 'Hero Image',
            description: 'Main image for the town (used in cards and hero sections)',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'overviewLong',
            title: 'Long Overview',
            type: 'array',
            of: [{ type: 'block' }],
        }),
        defineField({
            name: 'lifestyle',
            title: 'Lifestyle',
            type: 'text',
        }),
        defineField({
            name: 'marketNotes',
            title: 'Market Notes',
            type: 'text',
        }),
        defineField({
            name: 'faqs',
            title: 'FAQs',
            type: 'array',
            of: [{ type: 'reference', to: { type: 'faq' } }],
        }),
        defineField({
            name: 'highlights',
            title: 'Highlights',
            description: 'Key highlights about this town (5-7 bullet points with specific local details)',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'curatedPois',
            title: 'Curated Points of Interest',
            description: 'Manually curated local favorites - fallback when Google Places is unavailable',
            type: 'array',
            of: [
                {
                    type: 'object',
                    name: 'curatedPoi',
                    title: 'Point of Interest',
                    fields: [
                        defineField({
                            name: 'category',
                            title: 'Category',
                            type: 'string',
                            options: {
                                list: [
                                    { title: 'Coffee', value: 'coffee' },
                                    { title: 'Restaurants', value: 'restaurants' },
                                    { title: 'Parks & Trails', value: 'parksTrails' },
                                    { title: 'Shopping', value: 'shopping' },
                                    { title: 'Fitness', value: 'fitness' },
                                    { title: 'Family', value: 'family' },
                                ],
                            },
                            validation: (Rule) => Rule.required(),
                        }),
                        defineField({
                            name: 'name',
                            title: 'Name',
                            type: 'string',
                            validation: (Rule) => Rule.required(),
                        }),
                        defineField({
                            name: 'note',
                            title: 'Note',
                            description: 'Short description or why this is a local favorite',
                            type: 'string',
                        }),
                        defineField({
                            name: 'url',
                            title: 'Website URL',
                            type: 'url',
                        }),
                    ],
                },
            ],
        }),
        defineField({
            name: 'seoTitle',
            title: 'SEO Title',
            type: 'string',
        }),
        defineField({
            name: 'seoDescription',
            title: 'SEO Description',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'videoEmbedUrl',
            title: 'Video Embed URL',
            type: 'url',
        }),
        defineField({
            name: 'lastReviewedAt',
            title: 'Last Reviewed At',
            type: 'datetime',
        }),
    ],
})
