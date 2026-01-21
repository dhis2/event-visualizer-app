import type {
    EventVisualization as EventVisualizationGenerated,
    EventRepetition,
    Program,
    ProgramStage,
    ValueType,
    LegendDisplayStrategy,
    LegendDisplayStyle,
    DimensionalItemObject,
} from './dhis2-openapi-schemas'
import type { DimensionType } from './dimension'
import type { MetadataInputMap } from './metadata'
import type { VisualizationType } from './visualization-type'

type IdRecord = { id: string }
type IdNameRecord = IdRecord & { name: string }

type MetadataRecordArray<T extends string> = Array<Record<T, IdNameRecord>>

/**
 * DimensionRecord represents dimension data from the DHIS2 API.
 * dimensionType uses OpenApiDimensionType directly (e.g., PROGRAM_DATA_ELEMENT, not DATA_ELEMENT).
 *
 * Note: transformDimensions() may map PROGRAM_DATA_ELEMENT → PROGRAM_DATA_ELEMENT for certain contexts,
 * but the type remains OpenApiDimensionType throughout.
 */
export type DimensionRecord = {
    dimension: string
    dimensionType?: DimensionType
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

type ProgramStageRecord = Pick<
    ProgramStage,
    | 'displayExecutionDateLabel'
    | 'displayDueDateLabel'
    | 'hideDueDate'
    | 'repeatable'
> & {
    id: string
    name: string
}

type ProgramRecord = Pick<
    Program,
    | 'programType'
    | 'displayEnrollmentDateLabel'
    | 'displayIncidentDateLabel'
    | 'displayIncidentDate'
> & {
    id: string
    name: string
    programStages: Array<
        Pick<ProgramStage, 'id' | 'repeatable'> & {
            name: string
        }
    >
}

type ProgramDimensionArray = Array<
    Pick<
        Program,
        | 'enrollmentDateLabel'
        | 'incidentDateLabel'
        | 'programType'
        | 'displayIncidentDate'
        | 'displayEnrollmentDateLabel'
        | 'displayIncidentDateLabel'
    > & {
        id: string
        name: string
        programStages: Array<ProgramStageRecord>
    }
>

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
    program: ProgramRecord
    programStage: ProgramStageRecord
    programDimensions: ProgramDimensionArray
    trackedEntityType: IdNameRecord

    // Custom dimension metadata arrays (from getDimensionMetadataFields)
    dataElementDimensions: DataElementDimensionArray
    attributeDimensions: MetadataRecordArray<'attribute'>
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
}

export type SavedVisualization = Omit<
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

export type EmptyVisualization = Record<string, never>
export type NewVisualization = Partial<Omit<SavedVisualization, 'id'>> &
    Required<Pick<SavedVisualization, 'outputType' | 'type'>>
export type CurrentVisualization =
    | EmptyVisualization
    | NewVisualization
    | SavedVisualization

export type VisualizationNameDescription = Pick<
    SavedVisualization,
    'name' | 'displayName' | 'description' | 'displayDescription'
>
