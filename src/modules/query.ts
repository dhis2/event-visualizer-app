import type { CurrentUser } from '@types'

/*
 * Program stages have no shortName, so their name always comes from
 * displayName regardless of the user's display property setting.
 */
export const programStageFields = [
    'id',
    'displayName~rename(name)',
    'displayExecutionDateLabel',
    'displayDueDateLabel',
    'displayProgramStageLabel',
    'displayEventLabel',
    'repeatable',
    'hideDueDate',
    'program[id]',
].join(',')

/**
 * Get program fields with dynamic name property
 * Includes program stages by default
 */
export const getProgramFields = (
    displayNameProp: CurrentUser['settings']['displayNameProperty']
): string =>
    [
        'id',
        'programType',
        `${displayNameProp}~rename(name)`,
        'displayEnrollmentDateLabel',
        'displayEnrollmentLabel',
        'displayEnrollmentsLabel',
        'displayEventLabel',
        'displayEventsLabel',
        'displayIncidentDate',
        'displayIncidentDateLabel',
        'displayOrgUnitLabel',
        'displayProgramStageLabel',
        'displayTrackedEntityAttributeLabel',
        'enrollmentDateLabel',
        'incidentDateLabel',
        `programStages[${programStageFields}]`,
        `trackedEntityType[${getTrackedEntityTypeFields(displayNameProp)}]`,
    ].join(',')

/**
 * Get tracked entity type fields with dynamic name property
 */
export const getTrackedEntityTypeFields = (
    displayNameProp: CurrentUser['settings']['displayNameProperty']
): string =>
    [
        'id',
        `${displayNameProp}~rename(name)`,
        'displayTrackedEntityTypesLabel',
    ].join(',')

/* The fields that decide whether a data element or attribute can be
 * aggregated as the cell value, and how: whether it is numeric and its own
 * aggregation type, plus its name. Every query for an item that might become
 * the cell value asks for them, so its metadata is the same whether it comes
 * from the sidebar, the layout or the cell value of a saved visualization. */
export const getAggregatableDimensionFields = (
    displayNameProp: CurrentUser['settings']['displayNameProperty']
): string =>
    [
        'id',
        `${displayNameProp}~rename(name)`,
        'valueType',
        'aggregationType',
    ].join(',')

export const getDimensionMetadataFields = (): string[] => [
    'dataElementDimensions[dataElement[id,name],legendSet[id,name]]',
    'attributeDimensions[attribute[id,name]]',
    'programIndicatorDimensions[programIndicator[id,name]]',
    'categoryDimensions[category[id,name]]',
    'categoryOptionGroupSetDimensions[categoryOptionGroupSet[id,name]]',
    'organisationUnitGroupSetDimensions[organisationUnitGroupSet[id,name]]',
    'dataElementGroupSetDimensions[dataElementGroupSet[id,name]]',
]

/*
 * Option sets and legend sets have no shortName, so their names always come
 * from displayName regardless of the user's display property setting.
 */
export const dimensionFields = [
    'dimension',
    'dimensionType',
    'filter',
    'program[id]',
    'programStage[id]',
    'optionSet[id,displayName~rename(name)]',
    'valueType',
    'legendSet[id,displayName~rename(name)]',
    'repetition',
    'items[dimensionItem~rename(id)]',
].join(',')
