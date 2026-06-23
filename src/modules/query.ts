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
        'displayEventLabel',
        'displayIncidentDate',
        'displayIncidentDateLabel',
        'displayOrgUnitLabel',
        'displayProgramStageLabel',
        'displayTrackedEntityAttributeLabel',
        'enrollmentDateLabel',
        'incidentDateLabel',
        `programStages[${programStageFields}]`,
        `trackedEntityType[id,${displayNameProp}~rename(name)]`,
    ].join(',')

/**
 * Get tracked entity type fields with dynamic name property
 */
export const getTrackedEntityTypeFields = (
    displayNameProp: CurrentUser['settings']['displayNameProperty']
): string => ['id', `${displayNameProp}~rename(name)`].join(',')

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
