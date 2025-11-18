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
import type { MetadataInput } from '@components/app-wrapper/metadata-helpers/types'
import type { ExtendedDimensionType, VisualizationType } from '@types'

type IdRecord = { id: string }
type IdNameRecord = IdRecord & { name: string }

type MetadataRecordArray<T extends string> = Array<Record<T, IdNameRecord>>

export type DimensionRecord = {
    dimension: string
    dimensionType?: ExtendedDimensionType
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
    metaData: MetadataInput
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
