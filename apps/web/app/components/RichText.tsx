import { PortableText, PortableTextComponents } from '@portabletext/react'
import { urlFor } from '../lib/sanity.image'
import Image from 'next/image'

type Props = {
    value: any
}

const components: PortableTextComponents = {
    types: {
        image: ({ value }) => {
            // Basic image support
            return (
                <div className="my-8 relative w-full h-80">
                    <Image
                        src={urlFor(value).url()}
                        alt={value.alt || 'Post image'}
                        fill
                        className="object-cover rounded-lg"
                    />
                </div>
            )
        },
    },
    block: {
        h2: ({ children }) => <h2 className="text-2xl font-bold mt-8 mb-4">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xl font-bold mt-6 mb-3">{children}</h3>,
        normal: ({ children }) => <p className="mb-4 leading-relaxed text-gray-700">{children}</p>,
        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-600">
                {children}
            </blockquote>
        ),
    },
    list: {
        bullet: ({ children }) => <ul className="list-disc ml-5 mb-4">{children}</ul>,
        number: ({ children }) => <ol className="list-decimal ml-5 mb-4">{children}</ol>,
    },
}

export default function RichText({ value }: Props) {
    return <PortableText value={value} components={components} />
}
