import type { CurrentUser } from '@types'

/**
 * Get program stage fields with dynamic name property
 */
export const getProgramStageFields = (
    displayNameProp: CurrentUser['settings']['displayNameProperty']
): string =>
    [
        'id',
        `${displayNameProp}~rename(name)`,
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
        'displayEventLabel',
        'displayIncidentDate',
        'displayIncidentDateLabel',
        'displayOrgUnitLabel',
        'displayProgramStageLabel',
        'displayTrackedEntityAttributeLabel',
        'enrollmentDateLabel',
        'incidentDateLabel',
        `programStages[${getProgramStageFields(displayNameProp)}]`,
        `trackedEntityType[id,${displayNameProp}~rename(name)]`,
    ].join(',')

/**
 * Get tracked entity type fields with dynamic name property
 */
export const getTrackedEntityTypeFields = (
    displayNameProp: CurrentUser['settings']['displayNameProperty']
): string => ['id', `${displayNameProp}~rename(name)`].join(',')

/**
 * Get dimension fields with dynamic name property for optionSet and legendSet
 */
export const getDimensionFields = (
    displayNameProp: CurrentUser['settings']['displayNameProperty']
): string =>
    [
        'dimension',
        'dimensionType',
        'filter',
        'program[id]',
        'programStage[id]',
        `optionSet[id,${displayNameProp}~rename(name)]`,
        'valueType',
        `legendSet[id,${displayNameProp}~rename(name)]`,
        'repetition',
        'items[dimensionItem~rename(id)]',
    ].join(',')
