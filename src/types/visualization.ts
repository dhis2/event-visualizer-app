import type {
    EventVisualization as EventVisualizationGenerated,
    EventRepetition,
    ValueType,
    LegendDisplayStrategy,
    LegendDisplayStyle,
    DimensionalItemObject,
} from './dhis2-openapi-schemas'
import type { DimensionType } from './dimension'
import type { MetadataInputMap } from './metadata'
import type { EventVisualizationOptions } from './options'
import type { Program } from './program'
import type { ProgramStage } from './program-stage'
import type { VisualizationType } from './visualization-type'

type IdRecord = { id: string }
type IdNameRecord = IdRecord & { name: string }

type MetadataRecordArray<T extends string> = Array<Record<T, IdNameRecord>>

/**
 * DimensionRecord represents dimension data from the DHIS2 API.
 *
 * dimensionType can be:
 * - 'PROGRAM_DATA_ELEMENT' (untransformed API value)
 * - A DimensionType value (includes transformed values like 'DATA_ELEMENT',
 *   plus app-specific types like 'STATUS' and 'USER')
 *
 * transformDimensions() converts PROGRAM_DATA_ELEMENT → DATA_ELEMENT where needed.
 */
export type DimensionRecord = {
    dimension: string
    dimensionType?: DimensionType | 'PROGRAM_DATA_ELEMENT'
    filter?: string
    program?: IdRecord
    programStage?: IdRecord
    optionSet?: IdRecord
    valueType?: ValueType
    legendSet?: IdRecord
    repetition?: EventRepetition
    items: Array<DimensionalItemObject>
}

export type DimensionArray = Array<DimensionRecord>

type ProgramDimensionArray = Array<Program>

type DataElementDimensionArray = Array<{
    legendSet: IdNameRecord
    dataElement: IdNameRecord
}>

type SavedVisualizationFieldOverrides = {
    id: string
    // API transforms with ~rename or custom structures
    columns: DimensionArray
    rows: DimensionArray
    filters: DimensionArray
    program: Program
    programStage: ProgramStage
    programDimensions?: ProgramDimensionArray
    trackedEntityType?: IdNameRecord

    // Custom dimension metadata arrays (from getDimensionMetadataFields)
    dataElementDimensions: DataElementDimensionArray
    attributeDimensions?: MetadataRecordArray<'attribute'>
    programIndicatorDimensions: MetadataRecordArray<'programIndicator'>
    categoryDimensions: MetadataRecordArray<'category'>
    categoryOptionGroupSetDimensions: MetadataRecordArray<'categoryOptionGroupSet'>
    organisationUnitGroupSetDimensions: MetadataRecordArray<'organisationUnitGroupSet'>
    dataElementGroupSetDimensions: MetadataRecordArray<'dataElementGroupSet'>

    // Manual overrides for better typing
    legend: {
        set: { id: string; displayName: string }
        strategy: LegendDisplayStrategy
        style: LegendDisplayStyle
        showKey: boolean
    }
    metaData: MetadataInputMap
    type: VisualizationType
    // name does not need to be propagated to currentVis on update
    value?: IdRecord & { name?: string }
}

/**
 * ApiSavedVisualization is the pre-normalization shape as received from the
 * eventVisualizations API. It still carries the legacy top-level `program` and
 * `programStage` fields and may represent either of the two legacy shapes
 * (`legacy: true` from the old line-listing app, or the old event-visualizer
 * shape with top-level program/programStage). This is the input to the
 * legacy → canonical normaliser.
 */
export type ApiSavedVisualization = Omit<
    EventVisualizationGenerated,
    // Omit overridden fields so optional fields from the generated type can be set to required
    | keyof SavedVisualizationFieldOverrides
    | 'interpretations'
    | 'userGroupAccesses'
    | 'publicAccess'
    | 'rewindRelativePeriods'
    | 'userOrganisationUnit'
    | 'userOrganisationUnitChildren'
    | 'userOrganisationUnitGrandChildren'
    | 'externalAccess'
    | 'relativePeriods'
    | 'columnDimensions'
    | 'rowDimensions'
    | 'filterDimensions'
    | 'organisationUnitGroups'
    | 'itemOrganisationUnitGroups'
    | 'indicators'
    | 'dataElements'
    | 'dataElementOperands'
    | 'dataElementGroups'
    | 'dataSets'
    | 'periods'
    | 'organisationUnitLevels'
    | 'organisationUnits'
    | 'user'
> &
    SavedVisualizationFieldOverrides

/**
 * SavedVisualization is the canonical, normalised shape the app works with.
 * `program` and `programStage` are not carried at the top level — programs
 * live in `programDimensions`, stages on individual dimension entries.
 * `legacy` remains (optional) so the app can disable regular save on legacy
 * visualizations and only allow "Save as".
 */
export type SavedVisualization = Omit<
    ApiSavedVisualization,
    'program' | 'programStage'
>

export type EmptyVisualization = Record<string, never>
export type CurrentVisualization = Pick<
    SavedVisualization,
    | 'type'
    | 'outputType'
    | 'columns'
    | 'rows'
    | 'filters'
    | 'trackedEntityType'
    | 'attributeDimensions'
    | 'programDimensions'
    | 'sorting'
    | 'value'
> &
    EventVisualizationOptions & {
        id?: string
    }

export type VisualizationNameDescription = Pick<
    SavedVisualization,
    'name' | 'displayName' | 'description' | 'displayDescription'
>
