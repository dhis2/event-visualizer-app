import type { MetadataItem, ProgramType, OptionSet, LegendSet } from '@types'

// OptionSet type from the OpenApiSpecs is very permissive, but we require name and id
export type OptionSetMetadataItem = OptionSet & {
    id: string
    name: string
}

export type LegendSetMetadataItem = Required<
    Pick<LegendSet, 'id' | 'name' | 'legends'>
>

// User org units, relative periods, etc - object with one string key and string value
export type SimpleMetadataItem = { [key: string]: string }

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
    | LegendSetMetadataItem

export type NormalizedMetadataItem = Omit<MetadataItem, 'uid'> & { id: string }

// Before inserting into the store we normalise the data so that we always have an id and name field and never a uid field
export type MetadataStoreItem =
    | NormalizedMetadataItem
    | OptionSetMetadataItem
    | LegendSetMetadataItem
    | ProgramMetadataItem

export type MetadataInput =
    | AnyMetadataItemInput
    | AnyMetadataItemInput[]
    | Record<string, AnyMetadataItemInput>

export type Subscriber = () => void
