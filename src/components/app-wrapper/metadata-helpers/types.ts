import type { MetadataItem, ProgramType, OptionSet, LegendSet } from '@types'

type OptionSetOption = Omit<OptionSet['options'], 'id' | 'code' | 'name'> & {
    id: string
    code: string
    name: string
}

type LegendSetLegend = Omit<LegendSet['legends'], 'id' | 'name'> & {
    id: string
    name: string
}

export type OptionSetMetadataItem = Omit<
    OptionSet,
    'id' | 'options' | 'valueType' | 'version'
> & {
    // `id` and `options` are required fields
    id: string
    options: Array<OptionSetOption>
    /* `valueType` and `version` need to be made optional, because when loading a saved
     * visualization, the option set metadata object is nothing more than a list of options */
    valueType?: OptionSet['valueType']
    version?: OptionSet['version']
}

export type LegendSetMetadataItem = Omit<LegendSet, 'id' | 'legends'> & {
    id: string
    legends: Array<LegendSetLegend>
    name?: string
}

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
    | UserOrgUnitMetadataInputItem

export type NormalizedMetadataItem = Omit<MetadataItem, 'uid'> & { id: string }

// Before inserting into the store we normalise the data so that we always have an id and name field and never a uid field
export type MetadataStoreItem =
    | NormalizedMetadataItem
    | OptionSetMetadataItem
    | LegendSetMetadataItem
    | ProgramMetadataItem
    | ProgramStageMetadataItem
    | UserOrgUnitMetadataItem

export type MetadataInput =
    | AnyMetadataItemInput
    | AnyMetadataItemInput[]
    | Record<string, AnyMetadataItemInput>

export type Subscriber = () => void

export type UserOrgUnitMetadataInputItem = {
    organisationUnits: string[]
}

export type UserOrgUnitMetadataItem = UserOrgUnitMetadataInputItem & {
    name: string
    id: string
}

export type AnalyticsMetadataInput = Record<string, AnyMetadataItemInput> & {
    USER_ORG_UNIT?: { organisationUnits: string[] }
}
