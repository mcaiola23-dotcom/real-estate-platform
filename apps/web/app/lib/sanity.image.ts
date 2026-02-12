import createImageUrlBuilder from '@sanity/image-url'
import type { Image } from 'sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

const imageBuilder = createImageUrlBuilder({
    projectId: projectId || '',
    dataset: dataset || '',
})

export const urlFor = (source: Image) => {
    return imageBuilder.image(source)
}
