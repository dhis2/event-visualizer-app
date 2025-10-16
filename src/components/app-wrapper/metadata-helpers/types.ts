import type { MetadataItem, ProgramType, OptionSet, LegendSet } from '@types'

// OptionSet type from the OpenApiSpecs is very permissive, but we require name and id
export type OptionSetMetadataItem = OptionSet & {
    id: string
    name: string
}

export type LegendSetMetadataItem = Required<
    Pick<LegendSet, 'id' | 'name' | 'legends'>
>

export type OrganisationUnitMetadataItem = Omit<MetadataItem, 'uid'> & {
    id: string
    path: string
}

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

export type ProgramStageMetadataItem = {
    id: string
    name: string
    repeatable: boolean
    hideDueDate: boolean
    displayExecutionDateLabel?: string
}

// Note that we accept a lot of different input formats: id/uid/id=is-key, name/name-is-value
export type AnyMetadataItemInput =
    | MetadataItem
    | SimpleMetadataItem
    | ProgramMetadataItem
    | ProgramStageMetadataItem
    | OptionSetMetadataItem
    | LegendSetMetadataItem
    | OrganisationUnitMetadataItem

export type NormalizedMetadataItem = Omit<MetadataItem, 'uid'> & { id: string }

// Before inserting into the store we normalise the data so that we always have an id and name field and never a uid field
export type MetadataStoreItem =
    | NormalizedMetadataItem
    | OptionSetMetadataItem
    | ProgramMetadataItem
    | ProgramStageMetadataItem

export type MetadataInput =
    | AnyMetadataItemInput
    | AnyMetadataItemInput[]
    | Record<string, AnyMetadataItemInput>

export type Subscriber = () => void
