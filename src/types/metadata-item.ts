import type { MetadataItem as OpenApiMetadataItem } from './dhis2-openapi-schemas'

// MetadataItem from OpenApiSpecs has a lot of required properties that are
// optional in the analytics API, so we make them optional with the Partial helper.
// But we do require uid and name
export type MetadataItem = Partial<OpenApiMetadataItem> & {
    uid: string
    name: string
}
