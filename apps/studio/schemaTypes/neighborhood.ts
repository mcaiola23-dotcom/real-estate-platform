import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'neighborhood',
    title: 'Neighborhood',
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
            name: 'town',
            title: 'Town',
            type: 'reference',
            to: { type: 'town' },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'center',
            title: 'Center Coordinates',
            description: 'Representative lat/lng for the neighborhood. Used for geo-based data modules (nearby schools, POIs, Walk Score).',
            type: 'geopoint',
        }),
        defineField({
            name: 'overview',
            title: 'Overview',
            description: 'Short overview (1-2 sentences) for preview cards',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'description',
            title: 'Description',
            description: 'Long-form description (2-4 paragraphs) covering character, housing, amenities, who it suits, and commute',
            type: 'array',
            of: [{ type: 'block' }],
        }),
        defineField({
            name: 'highlights',
            title: 'Highlights',
            description: 'Key highlights about this neighborhood (3-5 specific bullet points)',
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
            name: 'housingCharacteristics',
            title: 'Housing Characteristics',
            type: 'text',
        }),
        defineField({
            name: 'marketNotes',
            title: 'Market Notes',
            type: 'text',
        }),
        defineField({
            name: 'locationAccess',
            title: 'Location & Access',
            type: 'text',
        }),
        defineField({
            name: 'faqs',
            title: 'FAQs',
            type: 'array',
            of: [{ type: 'reference', to: { type: 'faq' } }],
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
