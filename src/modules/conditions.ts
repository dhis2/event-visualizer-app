import i18n from '@dhis2/d2-i18n'
import {
    combineAllDimensionsFromVisualization,
    getFullDimensionId,
} from './dimension'
import type { LayoutDimension } from '@components/layout-panel/chip'
import { formatValue, ouIdHelper } from '@dhis2/analytics'
import type {
    CurrentVisualization,
    OutputType,
    SavedVisualization,
    ValueType,
} from '@types'

type Conditions = {
    condition?: string | string[]
    legendSet?: string
}
type FormatValueOptions = {
    locale?: string
    digitGroupSeparator?: SavedVisualization['digitGroupSeparator']
    baseUrl?: string
}

// parse e.g. 'LT:25:GT:15' to ['LT:25', 'GT:15']
export const parseConditionsStringToArray = (
    conditionsStringOrArray: string | Array<string>
): Array<string> =>
    Array.isArray(conditionsStringOrArray)
        ? conditionsStringOrArray
        : conditionsStringOrArray.match(/[^:]+:[^:]+/g) ?? []

// parse e.g. ['LT:25', 'GT:15'] to 'LT:25:GT:15'
export const parseConditionsArrayToString = (
    conditionsArray: Array<string>
): string => conditionsArray.join(':')

export const parseCondition = (conditionItem: string) =>
    conditionItem.split(':').pop()?.split(';')

/**
 * Boolean value representations
 */
type BooleanValue =
    /** No value */
    | 'NV'
    /** True */
    | '1'
    /** False */
    | '0'

/**
 * Query operators for filtering conditions
 */
export type QueryOperator =
    /** Equal */
    | 'EQ'
    /** Equal (case insensitive) */
    | 'IEQ'
    /** Greater than */
    | 'GT'
    /** Greater than or equal */
    | 'GE'
    /** Less than */
    | 'LT'
    /** Less than or equal */
    | 'LE'
    /** Not equal */
    | '!EQ'
    /** Empty/null value */
    | 'EQ:NV'
    /** Not empty/not null */
    | 'NE:NV'
    /** In (contains any of) */
    | 'IN'
    /** Contains (like) */
    | 'LIKE'
    /** Contains (like case insensitive) */
    | 'ILIKE'
    /** Does not contain */
    | '!LIKE'

/**
 * Query prefixes for modifying operators
 */
type QueryPrefix =
    /** Case insensitive */
    | 'I'
    /** Negation */
    | '!'

/**
 * Numeric query operators for filtering conditions
 */
type NumericQueryOperator = Extract<
    QueryOperator,
    'EQ' | 'GT' | 'GE' | 'LT' | 'LE' | '!EQ' | 'EQ:NV' | 'NE:NV'
>
export const getNumericOperators = (): Record<
    NumericQueryOperator,
    string
> => ({
    EQ: i18n.t('equal to (=)'),
    GT: i18n.t('greater than (>)'),
    GE: i18n.t('greater than or equal to (≥)'),
    LT: i18n.t('less than (<)'),
    LE: i18n.t('less than or equal to (≤)'),
    '!EQ': i18n.t('not equal to (≠)'),
    'EQ:NV': i18n.t('is empty / null'),
    'NE:NV': i18n.t('is not empty / not null'),
})

/**
 * Alphanumeric query operators for filtering conditions
 */
type AlphaNumericQueryOperator = Extract<
    QueryOperator,
    'EQ' | '!EQ' | 'LIKE' | '!LIKE' | 'EQ:NV' | 'NE:NV'
>
export const getAlphaNumericOperators = (): Record<
    AlphaNumericQueryOperator,
    string
> => ({
    EQ: i18n.t('exactly'),
    '!EQ': i18n.t('is not'),
    LIKE: i18n.t('contains'),
    '!LIKE': i18n.t('does not contain'),
    'EQ:NV': i18n.t('is empty / null'),
    'NE:NV': i18n.t('is not empty / not null'),
})

/**
 * Date query operators for filtering conditions
 */
type DateQueryOperator = Extract<
    QueryOperator,
    'EQ' | '!EQ' | 'GT' | 'GE' | 'LT' | 'LE' | 'EQ:NV' | 'NE:NV'
>

export const getDateOperators = (): Record<DateQueryOperator, string> => ({
    EQ: i18n.t('exactly'),
    '!EQ': i18n.t('is not'),
    GT: i18n.t('after'),
    GE: i18n.t('after or including'),
    LT: i18n.t('before'),
    LE: i18n.t('before or including'),
    'EQ:NV': i18n.t('is empty / null'),
    'NE:NV': i18n.t('is not empty / not null'),
})

export const getBooleanValues = (): Record<BooleanValue, string> => ({
    '1': i18n.t('Yes'),
    '0': i18n.t('No'),
    NV: i18n.t('Not answered'),
})

export const API_TIME_DIVIDER = '.'
export const UI_TIME_DIVIDER = ':'
export const API_DATETIME_DIVIDER = 'T'
export const UI_DATETIME_DIVIDER = ' '
export const FALSE_VALUE: BooleanValue = '0'
export const NULL_VALUE: BooleanValue = 'NV'
export const TRUE_VALUE: BooleanValue = '1'
export const OPERATOR_IN: QueryOperator = 'IN'
export const OPERATOR_EQUAL: QueryOperator = 'EQ'
export const OPERATOR_EMPTY = `EQ:${NULL_VALUE}`
export const OPERATOR_NOT_EMPTY = `NE:${NULL_VALUE}`
export const PREFIX_CASE_INSENSITIVE: QueryPrefix = 'I'
export const PREFIX_NOT: QueryPrefix = '!'

export const addCaseSensitivePrefix = (
    operator: QueryOperator,
    isCaseSensitive: boolean
): QueryOperator => {
    if (isCaseSensitive) {
        // e.g. LIKE -> LIKE
        return operator
    } else {
        if (operator[0] === PREFIX_NOT) {
            // e.g. !LIKE -> !ILIKE
            return `${PREFIX_NOT}${PREFIX_CASE_INSENSITIVE}${operator.substring(
                1
            )}` as QueryOperator
        } else {
            // e.g. LIKE -> ILIKE
            return `${PREFIX_CASE_INSENSITIVE}${operator}` as QueryOperator
        }
    }
}

export const removeCaseSensitivePrefix = (
    operator: QueryOperator
): QueryOperator => {
    const isCaseSensitive = isIsCaseSensitive(operator)
    if (isCaseSensitive) {
        // e.g. LIKE -> LIKE, !LIKE -> !LIKE
        return operator
    } else {
        if (operator[0] === PREFIX_NOT) {
            // e.g. !ILIKE -> !LIKE
            return `${PREFIX_NOT}${operator.substring(2)}` as QueryOperator
        } else {
            // e.g. ILIKE -> LIKE
            return `${operator.substring(1)}` as QueryOperator
        }
    }
}

// TODO: - in practice this function isn't used for the 'IN' operator
// but if it were the result would be wrong. The function
// should probably control for the allowed operators and throw if the
// operator isn't one of the allowed ones.
export const isIsCaseSensitive = (operator: QueryOperator): boolean => {
    // default is false (case insensitive)
    if (!operator) {
        return false
    }

    if (operator[0] === PREFIX_NOT) {
        // !LIKE, !ILIKE, !EQ, !IEQ
        return operator[1] !== PREFIX_CASE_INSENSITIVE
    } else {
        // LIKE, ILIKE, EQ, IEQ
        return operator[0] !== PREFIX_CASE_INSENSITIVE
    }
}

const getOperatorsByValueType = (valueType?: ValueType) => {
    switch (valueType) {
        case 'LETTER':
        case 'TEXT':
        case 'LONG_TEXT':
        case 'EMAIL':
        case 'USERNAME':
        case 'URL':
        case 'PHONE_NUMBER': {
            return getAlphaNumericOperators()
        }
        case 'DATE':
        case 'TIME':
        case 'DATETIME': {
            return getDateOperators()
        }
        case 'NUMBER':
        case 'UNIT_INTERVAL':
        case 'PERCENTAGE':
        case 'INTEGER':
        case 'INTEGER_POSITIVE':
        case 'INTEGER_NEGATIVE':
        case 'INTEGER_ZERO_OR_POSITIVE':
        default: {
            return getNumericOperators()
        }
    }
}

const getOperatorsForDimension = (dimension: LayoutDimension) => {
    const valueType =
        dimension.dimensionType === 'PROGRAM_INDICATOR' && !dimension.valueType
            ? 'NUMBER'
            : dimension.valueType
    return getOperatorsByValueType(valueType)
}

const hasValidLegendSet = (
    conditions: Conditions
): conditions is Conditions & { legendSet: string } =>
    typeof conditions.legendSet === 'string' && conditions.legendSet.length > 0

const hasValidOptionSet = (
    dimension: LayoutDimension
): dimension is LayoutDimension & { optionSet: string } =>
    typeof dimension.optionSet === 'string' && dimension.optionSet.length > 0

export const shouldUseLegendSetConditions = (conditions: Conditions) =>
    hasValidLegendSet(conditions)

export const shouldUseOptionSetConditions = (
    conditions: Conditions,
    dimension: LayoutDimension,
    conditionsList: string[]
) =>
    !shouldUseLegendSetConditions(conditions) &&
    hasValidOptionSet(dimension) &&
    conditionsList.length > 0 &&
    conditionsList[0]?.startsWith(OPERATOR_IN)

export const shouldUseBooleanConditions = (
    conditions: Conditions,
    dimension: LayoutDimension,
    conditionsList: string[]
) =>
    !shouldUseLegendSetConditions(conditions) &&
    !shouldUseOptionSetConditions(conditions, dimension, conditionsList) &&
    ['BOOLEAN', 'TRUE_ONLY'].includes(dimension.valueType ?? '') &&
    conditionsList.length > 0 &&
    conditionsList[0]?.startsWith(OPERATOR_IN)

export const shouldUseOrgUnitConditions = (
    conditions: Conditions,
    dimension: LayoutDimension,
    conditionsList: string[]
) =>
    !shouldUseLegendSetConditions(conditions) &&
    !shouldUseOptionSetConditions(conditions, dimension, conditionsList) &&
    !shouldUseBooleanConditions(conditions, dimension, conditionsList) &&
    dimension.valueType === 'ORGANISATION_UNIT' &&
    conditionsList.length > 0 &&
    (conditionsList[0]?.startsWith(OPERATOR_EQUAL) ||
        conditionsList[0]?.startsWith(OPERATOR_IN))

export const getLegendSetConditionMetadataIds = (
    conditions: Conditions,
    conditionsList: string[]
): string[] => {
    if (!hasValidLegendSet(conditions)) {
        throw new Error(
            'Invalid conditions: legendSet must be a non-empty string'
        )
    }

    if (conditionsList.length === 0) {
        // Return the legend set ID when no specific legends are selected
        return [conditions.legendSet]
    } else {
        // Return the legend IDs from the condition
        const legendIds = parseCondition(conditionsList[0])
        return legendIds ?? []
    }
}

export const getOptionSetIdAndSelectedOptionCodes = (
    dimension: LayoutDimension,
    conditionsList: string[]
): { optionSetId: string; selectedOptionCodes: string[] } => {
    if (!hasValidOptionSet(dimension)) {
        throw new Error(
            'Invalid dimension: optionSet must be a non-empty string'
        )
    }

    // Return the option set ID and selected option codes
    return {
        optionSetId: dimension.optionSet,
        selectedOptionCodes: parseCondition(conditionsList[0]) ?? [],
    }
}

export const getBooleanConditionTexts = (
    conditionsList: string[]
): string[] => {
    const values = parseCondition(conditionsList[0]) ?? []
    return values.map((value) => getBooleanValues()[value])
}

export const getOrgUnitConditionMetadataIds = (
    conditionsList: string[],
    includeUnprefixed = false
): string[] => {
    const originalIds = parseCondition(conditionsList[0]) ?? []

    if (!includeUnprefixed) {
        return originalIds
    }

    // Include both original IDs and unprefixed versions for metadata fetching
    const allIds = [...originalIds]
    for (const id of originalIds) {
        const unprefixedId = ouIdHelper.removePrefix(id)
        if (unprefixedId !== id) {
            allIds.push(unprefixedId)
        }
    }

    return allIds
}

export const getOperatorConditionTexts = (
    dimension: LayoutDimension,
    conditionsList: string[],
    formatValueOptions: FormatValueOptions
): string[] => {
    const operators = getOperatorsForDimension(dimension)

    return conditionsList.map((condition) => {
        let operator: string = ''
        let value: string = ''

        if (condition.includes(NULL_VALUE)) {
            operator = condition
        } else {
            const parts = condition.split(':')
            const valueType =
                dimension.dimensionType === 'PROGRAM_INDICATOR'
                    ? 'NUMBER'
                    : dimension.valueType
            operator = removeCaseSensitivePrefix(parts[0] as QueryOperator)
            value = formatValue(parts[1], valueType!, formatValueOptions)
        }

        if (value && ['TIME', 'DATETIME'].includes(dimension.valueType ?? '')) {
            value = value.replaceAll(API_TIME_DIVIDER, UI_TIME_DIVIDER)
        }
        if (value && dimension.valueType === 'DATETIME') {
            value = value.replaceAll(API_DATETIME_DIVIDER, UI_DATETIME_DIVIDER)
        }

        const operatorName = operators[operator]

        if (typeof operatorName === 'string' && operatorName.length > 0) {
            const capitalCaseOperatorName =
                operatorName[0].toUpperCase() + operatorName.substring(1)

            return value
                ? `${capitalCaseOperatorName}: ${value}`
                : capitalCaseOperatorName
        } else {
            throw new Error('Could not read operatorName')
        }
    })
}

export const getConditionsFromVisualization = (
    vis: CurrentVisualization,
    outputType: OutputType
): Record<string, { condition?: string; legendSet?: string }> => {
    const result: Record<string, { condition?: string; legendSet?: string }> =
        {}

    const items = combineAllDimensionsFromVisualization(vis).filter(
        (item) => item.filter || item.legendSet
    )

    for (const item of items) {
        const dimensionId = getFullDimensionId({
            dimensionId: item.dimension,
            programId: item.program?.id,
            programStageId: item.programStage?.id,
            outputType,
        })
        result[dimensionId] = {
            condition: item.filter,
            legendSet: item.legendSet?.id,
        }
    }

    return result
}
