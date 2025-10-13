import i18n from '@dhis2/d2-i18n'
import { getFullDimensionId } from './dimension'
import {
    isLegendSetMetadataItem,
    isOptionSetMetadataItem,
} from '@components/app-wrapper/metadata-helpers/type-guards'
import type { LayoutDimension } from '@components/layout-panel/chip'
import { formatValue, ouIdHelper } from '@dhis2/analytics'
import type {
    CurrentVisualization,
    InputType,
    MetadataStore,
    SavedVisualization,
    ValueType,
} from '@types'

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

type GetMetadataItemFn = MetadataStore['getMetadataItem']

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
export const PREFIX_CASE_INSENSITIVE: QueryPrefix = 'I'
export const PREFIX_NOT: QueryPrefix = '!'
export const OPERATOR_IN: QueryOperator = 'IN'
export const OPERATOR_EQUAL: QueryOperator = 'EQ'
export const NULL_VALUE: BooleanValue = 'NV'

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
    const isCaseSensitive = checkIsCaseSensitive(operator)
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

// TODO - in practice this function isn't used for the 'IN' operator
// but if it were the result would be wrong. The function
// should probably control for the allowed operators and throw if the
// operator isn't one of the allowed ones.
export const checkIsCaseSensitive = (operator: QueryOperator): boolean => {
    if (operator[0] === PREFIX_NOT) {
        // !LIKE, !ILIKE, !EQ, !IEQ
        return operator[1] !== PREFIX_CASE_INSENSITIVE
    } else {
        // LIKE, ILIKE, EQ, IEQ
        return operator[0] !== PREFIX_CASE_INSENSITIVE
    }
}

const getOperatorsByValueType = (valueType: ValueType) => {
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

const lookupOptionSetOptionMetadata = (
    optionSetId: string,
    code: string,
    getMetadataItem: GetMetadataItemFn
) => {
    const optionSetMetaData = getMetadataItem(optionSetId)

    if (!optionSetMetaData) {
        return undefined
    }

    if (!isOptionSetMetadataItem(optionSetMetaData)) {
        throw new Error('Not a valid option set metadata item')
    }

    return optionSetMetaData.options?.find((option) => option.code === code)
}

interface GetConditionsTextsParams {
    conditions: {
        condition?: string | string[]
        legendSet?: string
    }
    dimension: LayoutDimension
    formatValueOptions: {
        locale?: string
        digitGroupSeparator?: SavedVisualization['digitGroupSeparator']
        baseUrl?: string
    }
    getMetadataItem: GetMetadataItemFn
}

export const getConditionsTexts = ({
    conditions,
    dimension,
    formatValueOptions,
    getMetadataItem,
}: GetConditionsTextsParams): Array<string> => {
    const conditionsList = parseConditionsStringToArray(
        conditions?.condition ?? ''
    )

    if (conditions?.legendSet) {
        if (conditionsList.length === 0) {
            const legendSetName = getMetadataItem(conditions.legendSet)?.name
            if (!legendSetName) {
                throw new Error('Could not read legend set name')
            }
            return [legendSetName]
        } else {
            const legendIds = parseCondition(conditionsList[0])
            const metadataLegendSet = getMetadataItem(conditions.legendSet)

            if (!legendIds || !metadataLegendSet) {
                return []
            }

            if (!isLegendSetMetadataItem(metadataLegendSet)) {
                throw new Error('Metadata item is not of type legend set')
            }

            return legendIds
                .map(
                    (legendId) =>
                        metadataLegendSet.legends.find((l) => l.id === legendId)
                            ?.name
                )
                .filter((maybeName) => typeof maybeName === 'string')
        }
    }

    if (
        typeof dimension.optionSet === 'string' &&
        conditionsList.length > 0 &&
        conditionsList[0]?.startsWith(OPERATOR_IN)
    ) {
        const optionSet = dimension.optionSet
        const items = parseCondition(conditionsList[0])

        if (!items) {
            return []
        }

        return items
            .map(
                (code) =>
                    lookupOptionSetOptionMetadata(
                        optionSet,
                        code,
                        getMetadataItem
                    )?.name
            )
            .filter((maybeName) => typeof maybeName === 'string')
    }

    if (
        ['BOOLEAN', 'TRUE_ONLY'].includes(dimension.valueType ?? '') &&
        conditionsList.length > 0 &&
        conditionsList[0]?.startsWith(OPERATOR_IN)
    ) {
        const values = parseCondition(conditionsList[0])
        return Array.isArray(values)
            ? values.map((value) => getBooleanValues()[value])
            : []
    }

    if (
        dimension.valueType === 'ORGANISATION_UNIT' &&
        conditionsList.length > 0 &&
        (conditionsList[0]?.startsWith(OPERATOR_EQUAL) ||
            conditionsList[0]?.startsWith(OPERATOR_IN))
    ) {
        const ouIds = parseCondition(conditionsList[0])
        return Array.isArray(ouIds)
            ? ouIds.map(
                  (ouId) =>
                      getMetadataItem(ouId)?.name ??
                      getMetadataItem(ouIdHelper.removePrefix(ouId))?.name ??
                      // Default to showing the ID, but this should never happen
                      ouId
              )
            : []
    }

    if (
        typeof dimension.valueType === 'undefined' &&
        dimension.dimensionType !== 'PROGRAM_INDICATOR'
    ) {
        return []
    }

    const valueTypeForOperators =
        dimension.dimensionType === 'PROGRAM_INDICATOR' && !dimension.valueType
            ? 'NUMBER'
            : dimension.valueType!
    const operators = getOperatorsByValueType(valueTypeForOperators)

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
    inputType: InputType
): Record<string, { condition?: string; legendSet?: string }> => {
    const result: Record<string, { condition?: string; legendSet?: string }> =
        {}

    const columns = vis.columns ?? []
    const rows = vis.rows ?? []
    const filters = vis.filters ?? []

    const items = [...columns, ...rows, ...filters].filter(
        (item) => item.filter || item.legendSet
    )

    for (const item of items) {
        const dimensionId = getFullDimensionId({
            dimensionId: item.dimension,
            programId: item.program?.id,
            programStageId: item.programStage?.id,
            inputType,
        })
        result[dimensionId] = {
            condition: item.filter,
            legendSet: item.legendSet?.id,
        }
    }

    return result
}
