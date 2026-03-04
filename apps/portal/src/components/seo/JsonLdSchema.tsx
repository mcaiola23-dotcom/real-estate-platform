import { Thing, WithContext, RealEstateListing, Place } from 'schema-dts'

type SchemaType = WithContext<Thing> | WithContext<RealEstateListing> | WithContext<Place>

interface JsonLdSchemaProps {
    schema: SchemaType
}

export default function JsonLdSchema({ schema }: JsonLdSchemaProps) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    )
}
