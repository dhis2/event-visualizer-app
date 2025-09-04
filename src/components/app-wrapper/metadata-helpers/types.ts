import type { SupportedDimensionType } from '@constants/dimension-types'
import type { SupportedValueType } from '@constants/value-types'
import type { MetadataItem, ProgramType, OptionSet } from '@types'

// OptionSet type from the OpenApiSpecs is very permissive, but we require name and id
export type OptionSetMetadataItem = OptionSet & {
    id: string
    name: string
}

// User org units, relative periods, etc - object with one string key and string value
export type SimpleMetadataItem = { [key: string]: string }

export type DimensionMetadataItem = {
    id: string
    name: string
    dimensionType: SupportedDimensionType
    valueType?: SupportedValueType
    optionSet?: string | null
    // Other properties we might need later can be added here
}

export type ProgramMetadataItem = {
    id: string
    programType: ProgramType
    name: string
    displayIncidentDate?: boolean
    programStages?: Array<{
        id: string
        repeatable: boolean
        name: string
    }>
    code?: string
}

// Note that we accept a lot of different input formats: id/uid/id=is-key, name/name-is-value
export type AnyMetadataItemInput =
    | MetadataItem
    | SimpleMetadataItem
    | ProgramMetadataItem
    | OptionSetMetadataItem

export type NormalizedMetadataItem = Omit<MetadataItem, 'uid'> & { id: string }

// Before inserting into the store we normalise the data so that we always have an id and name field and never a uid field
export type MetadataStoreItem =
    | NormalizedMetadataItem
    | OptionSetMetadataItem
    | ProgramMetadataItem
    | DimensionMetadataItem

export type MetadataInput =
    | AnyMetadataItemInput
    | AnyMetadataItemInput[]
    | Record<string, AnyMetadataItemInput>

export type Subscriber = () => void
