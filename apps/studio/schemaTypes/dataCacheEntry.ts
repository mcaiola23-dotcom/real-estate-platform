import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'dataCacheEntry',
    title: 'Data Cache Entry',
    type: 'document',
    description: 'Cached API responses for Walk Score, Google Places, etc.',
    fields: [
        defineField({
            name: 'key',
            title: 'Cache Key',
            description: 'Unique key: {provider}:{scope}:{townSlug}:{neighborhoodSlug?}:{variant}',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'provider',
            title: 'Provider',
            type: 'string',
            options: {
                list: [
                    { title: 'Walk Score', value: 'walkscore' },
                    { title: 'Google Places', value: 'googlePlaces' },
                    { title: 'ACS Demographics', value: 'acs' },
                    { title: 'Schools', value: 'schools' },
                    { title: 'Listings (Mock)', value: 'listingsMock' },
                ],
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'scope',
            title: 'Scope',
            type: 'string',
            options: {
                list: [
                    { title: 'Town', value: 'town' },
                    { title: 'Neighborhood', value: 'neighborhood' },
                ],
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
            name: 'neighborhood',
            title: 'Neighborhood',
            description: 'Only required when scope is "neighborhood"',
            type: 'reference',
            to: { type: 'neighborhood' },
        }),
        defineField({
            name: 'payload',
            title: 'Cached Payload',
            description: 'JSON string of the cached API response',
            type: 'text',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'fetchedAt',
            title: 'Fetched At',
            type: 'datetime',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'expiresAt',
            title: 'Expires At',
            type: 'datetime',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'sourceUrl',
            title: 'Source URL',
            description: 'URL to the original data source for attribution',
            type: 'url',
        }),
    ],
    preview: {
        select: {
            key: 'key',
            provider: 'provider',
            fetchedAt: 'fetchedAt',
        },
        prepare({ key, provider, fetchedAt }) {
            return {
                title: key || 'Unnamed cache entry',
                subtitle: `${provider} - ${fetchedAt ? new Date(fetchedAt).toLocaleDateString() : 'no date'}`,
            }
        },
    },
})
