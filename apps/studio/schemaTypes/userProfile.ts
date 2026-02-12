import { defineField, defineType } from 'sanity'

/**
 * User Profile Schema
 * 
 * Stores user data linked to Clerk authentication.
 * Used for cloud sync of saved homes and searches.
 */
export default defineType({
    name: 'userProfile',
    title: 'User Profile',
    type: 'document',
    fields: [
        defineField({
            name: 'clerkId',
            title: 'Clerk ID',
            type: 'string',
            description: 'Unique identifier from Clerk authentication',
            validation: (Rule) => Rule.required(),
            readOnly: true,
        }),
        defineField({
            name: 'email',
            title: 'Email',
            type: 'string',
            validation: (Rule) => Rule.email(),
        }),
        defineField({
            name: 'firstName',
            title: 'First Name',
            type: 'string',
        }),
        defineField({
            name: 'lastName',
            title: 'Last Name',
            type: 'string',
        }),
        defineField({
            name: 'savedHomes',
            title: 'Saved Homes',
            type: 'array',
            of: [{ type: 'string' }],
            description: 'Array of listing IDs the user has saved',
        }),
        defineField({
            name: 'savedSearches',
            title: 'Saved Searches',
            type: 'array',
            of: [
                {
                    type: 'object',
                    name: 'savedSearch',
                    title: 'Saved Search',
                    fields: [
                        {
                            name: 'name',
                            title: 'Name',
                            type: 'string',
                            validation: (Rule) => Rule.required(),
                        },
                        {
                            name: 'url',
                            title: 'URL',
                            type: 'string',
                            description: 'The full URL with search parameters',
                        },
                        {
                            name: 'filterState',
                            title: 'Filter State',
                            type: 'text',
                            description: 'JSON string of filter parameters',
                        },
                        {
                            name: 'createdAt',
                            title: 'Created At',
                            type: 'datetime',
                        },
                    ],
                    preview: {
                        select: {
                            title: 'name',
                            subtitle: 'createdAt',
                        },
                    },
                },
            ],
        }),
        defineField({
            name: 'createdAt',
            title: 'Created At',
            type: 'datetime',
            initialValue: () => new Date().toISOString(),
            readOnly: true,
        }),
        defineField({
            name: 'updatedAt',
            title: 'Updated At',
            type: 'datetime',
        }),
    ],
    preview: {
        select: {
            title: 'email',
            firstName: 'firstName',
            lastName: 'lastName',
            savedCount: 'savedHomes',
        },
        prepare({ title, firstName, lastName, savedCount }) {
            const name = [firstName, lastName].filter(Boolean).join(' ');
            const count = savedCount?.length || 0;
            return {
                title: name || title || 'Unknown User',
                subtitle: `${title || 'No email'} • ${count} saved homes`,
            };
        },
    },
})
