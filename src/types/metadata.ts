import type {
    MetadataItem as GeneratedMetadaItem,
    ProgramType,
    OptionSet,
    LegendSet,
} from './dhis2-openapi-schemas'
import type { DimensionType } from './dimension'

/** PHASES
 * 1. Data is provided as a single object, object map, or object array
 * 2. Data is processed at item level
 * 3. Each item is normalised:
 *    a. New items will now have at least an `id` and `name` field
 *    b. Pre-existing items at least an `id`
 * 4. Each item is then merged and from this point onwards is a full
 *    MetadataStoreItem
 */

/*********************************
 **** Phase 1 & 2: input data ****
 *********************************/

/* An object with some sort of ID field and potentially a name,
 * plus other unspecified properties */
type PartialMetadataInputItem = Record<string, unknown>
type StringMap = Record<string, string>
export type MetadataInputItem = Record<string, unknown> & {
    name?: string
    displayName?: string
} & ({ id: string; uid?: never } | { uid: string; id?: never })
export type MetadataInputMap = Record<
    string,
    MetadataInputItem | PartialMetadataInputItem
>
export type MetadataInput =
    | MetadataInputItem
    | MetadataInputItem[]
    | StringMap
    | MetadataInputMap

/**********************************
 **** Phase 3: normalized item ****
 **********************************/

export type NormalizedMetadataInputItem = Record<string, unknown> & {
    id: string
    name?: string
}

/****************************************************
 **** Phase 4: fully processed MetadataStoreItem ****
 ****************************************************/

export type DimensionMetadataItem = Omit<
    /* The generated type called MetadataItem actually represents a
     * dimension of sorts, but has a `uid` field rather than an `id`
     * and some required fields that we do not always populate */
    Partial<GeneratedMetadaItem>, // make all fiels optional
    | 'uid' // Omit because we use `id`
    | 'name' // Omit to make required
    | 'dimensionType' // Omit to make required and customise
    | 'dimensionItemType' // Omit to customise
    | 'options' // Omit because it does not reflect reality
> & {
    id: string // we use id not uid
    name: string // required instead of optional
    dimensionType: DimensionType // require and use "our" dimension type
    dimensionItemType?: DimensionType // use "our" dimension type
    optionSet?: string // Add ID reference to `optionSet`
    program?: string // Add ID reference to `program`
    programStage?: string // Add ID reference to `programStage`
}

// Note that `optionSet` and `legendSet` have an optional name
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
    /* `valueType` and `version` need to be kept optional, because when loading a saved
     * visualization, the option set metadata object is nothing more than a list of options */
    valueType?: OptionSet['valueType']
    version?: OptionSet['version']
}

export type LegendSetMetadataItem = Omit<LegendSet, 'id' | 'legends'> & {
    id: string
    legends: Array<LegendSetLegend>
    name?: string
}

export type OrganisationUnitMetadataItem = {
    id: string
    name: string
    path: string
}

export type UserOrgUnitMetadataItem = {
    id: string
    name: string
    organisationUnits: string[]
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

export type ProgramStageMetadataItem = {
    id: string
    name: string
    repeatable: boolean
    hideDueDate: boolean
    displayExecutionDateLabel?: string
}

export type MetadataItem =
    | DimensionMetadataItem
    | OptionSetMetadataItem
    | LegendSetMetadataItem
    | OrganisationUnitMetadataItem
    | UserOrgUnitMetadataItem
    | ProgramMetadataItem
    | ProgramStageMetadataItem

export type MetadataItemWithName = Exclude<
    MetadataItem,
    OptionSetMetadataItem | LegendSetMetadataItem
>

export type Subscriber = () => void

export type InitialMetadataItems = Record<
    string,
    string | MetadataInputItem | Partial<DimensionMetadataItem>
>
export type AnalyticsResponseMetadataItems = Record<string, MetadataInputItem>

export type DimensionMetadata = {
    dimensionId: string
    programId?: string
    programStageId?: string
    repetitionIndex?: string
    dimension?: DimensionMetadataItem
    program?: ProgramMetadataItem
    programStage?: ProgramStageMetadataItem
}
