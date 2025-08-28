import type {
    EventVisualization as EventVisualizationGenerated,
    DimensionType,
    EventRepetition,
    Program,
    ProgramStage,
    ValueType,
    LegendDisplayStrategy,
    LegendDisplayStyle,
} from './dhis2-openapi-schemas'

type IdRecord = { id: string }
type IdNameRecord = IdRecord & { name: string }

type MetadataRecordArray<T extends string> = Array<Record<T, IdNameRecord>>

type DimensionArray = Array<{
    dimension: string
    dimensionType: DimensionType
    filter: string
    program: IdRecord
    programStage: IdRecord
    optionSet: IdRecord
    valueType: ValueType
    legendSet: IdRecord
    repetition: EventRepetition
    items: Array<IdRecord>
}>

type ProgramStageRecord = Pick<
    ProgramStage,
    | 'id'
    | 'displayExecutionDateLabel'
    | 'displayDueDateLabel'
    | 'hideDueDate'
    | 'repeatable'
> & {
    name: string
}

type ProgramRecord = Pick<
    Program,
    | 'id'
    | 'programType'
    | 'displayEnrollmentDateLabel'
    | 'displayIncidentDateLabel'
    | 'displayIncidentDate'
> & {
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
        | 'id'
        | 'enrollmentDateLabel'
        | 'incidentDateLabel'
        | 'programType'
        | 'displayIncidentDate'
        | 'displayEnrollmentDateLabel'
        | 'displayIncidentDateLabel'
    > & {
        name: string
        programStages: Array<ProgramStageRecord>
    }
>

type DataElementDimensionArray = Array<{
    legendSet: IdNameRecord
    dataElement: IdNameRecord
}>

export type SavedVisualization = Omit<
    EventVisualizationGenerated,
    | 'id'
    | 'columns'
    | 'rows'
    | 'filters'
    | 'program'
    | 'programStage'
    | 'programDimensions'
    | 'dataElementDimensions'
    | 'legend'
    | 'trackedEntityType'
    | 'attributeDimensions'
    | 'programIndicatorDimensions'
    | 'categoryDimensions'
    | 'categoryOptionGroupSetDimensions'
    | 'organisationUnitGroupSetDimensions'
    | 'dataElementGroupSetDimensions'
    | 'dataElementDimensions'
    | 'interpretations'
    | 'userGroupAccesses'
    | 'publicAccess'
    | 'displayDescription'
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
> & {
    id: string
    dataElementDimensions: DataElementDimensionArray
    attributeDimensions: MetadataRecordArray<'attribute'>
    programIndicatorDimensions: MetadataRecordArray<'programIndicator'>
    categoryDimensions: MetadataRecordArray<'category'>
    categoryOptionGroupSetDimensions: MetadataRecordArray<'categoryOptionGroupSet'>
    organisationUnitGroupSetDimensions: MetadataRecordArray<'organisationUnitGroupSet'>
    dataElementGroupSetDimensions: MetadataRecordArray<'dataElementGroupSet'>
    columns: DimensionArray
    rows: DimensionArray
    filters: DimensionArray
    program: ProgramRecord
    programStage: ProgramStageRecord
    programDimensions: ProgramDimensionArray
    legend: {
        set: { id: string; displayName: string }
        strategy: LegendDisplayStrategy
        style: LegendDisplayStyle
        showKey: boolean
    }
    trackedEntityType: IdNameRecord
}

export type EmptyVisualization = Record<string, never>
export type NewVisualization = Partial<Omit<SavedVisualization, 'id'>>
export type CurrentVisualization =
    | EmptyVisualization
    | NewVisualization
    | SavedVisualization
