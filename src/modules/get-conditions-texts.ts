import { formatValue, ouIdHelper } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { formatDimensionId } from './dimensionId.js'
import type { LayoutDimension } from '@components/visualization-layout/chip'
import type { SupportedValueType } from '@constants/value-types'

// parse e.g. 'LT:25:GT:15' to ['LT:25', 'GT:15']
export const parseConditionsStringToArray = (conditionsString) =>
    conditionsString?.match(/[^:]+:[^:]+/g) || conditionsString || []

// parse e.g. ['LT:25', 'GT:15'] to 'LT:25:GT:15'
export const parseConditionsArrayToString = (conditionsArray) =>
    conditionsArray.join(':')

export const parseCondition = (conditionItem) =>
    conditionItem.split(':').pop().split(';')

export const NULL_VALUE = 'NV'
export const TRUE_VALUE = '1'
export const FALSE_VALUE = '0'

export const OPERATOR_EQUAL = 'EQ'
export const OPERATOR_GREATER = 'GT'
export const OPERATOR_GREATER_OR_EQUAL = 'GE'
export const OPERATOR_LESS = 'LT'
export const OPERATOR_LESS_OR_EQUAL = 'LE'
export const OPERATOR_NOT_EQUAL = '!EQ'
export const OPERATOR_EMPTY = `EQ:${NULL_VALUE}`
export const OPERATOR_NOT_EMPTY = `NE:${NULL_VALUE}`
export const OPERATOR_IN = 'IN'
export const OPERATOR_CONTAINS = 'LIKE'
export const OPERATOR_NOT_CONTAINS = '!LIKE'

export const PREFIX_CASE_INSENSITIVE = 'I'
export const PREFIX_NOT = '!'

export const getNumericOperators = () => ({
    [OPERATOR_EQUAL]: i18n.t('equal to (=)'),
    [OPERATOR_GREATER]: i18n.t('greater than (>)'),
    [OPERATOR_GREATER_OR_EQUAL]: i18n.t('greater than or equal to (≥)'),
    [OPERATOR_LESS]: i18n.t('less than (<)'),
    [OPERATOR_LESS_OR_EQUAL]: i18n.t('less than or equal to (≤)'),
    [OPERATOR_NOT_EQUAL]: i18n.t('not equal to (≠)'),
    [OPERATOR_EMPTY]: i18n.t('is empty / null'),
    [OPERATOR_NOT_EMPTY]: i18n.t('is not empty / not null'),
})

export const getAlphaNumericOperators = () => ({
    [OPERATOR_EQUAL]: i18n.t('exactly'),
    [OPERATOR_NOT_EQUAL]: i18n.t('is not'),
    [OPERATOR_CONTAINS]: i18n.t('contains'),
    [OPERATOR_NOT_CONTAINS]: i18n.t('does not contain'),
    [OPERATOR_EMPTY]: i18n.t('is empty / null'),
    [OPERATOR_NOT_EMPTY]: i18n.t('is not empty / not null'),
})

export const getDateOperators = () => ({
    [OPERATOR_EQUAL]: i18n.t('exactly'),
    [OPERATOR_NOT_EQUAL]: i18n.t('is not'),
    [OPERATOR_GREATER]: i18n.t('after'),
    [OPERATOR_GREATER_OR_EQUAL]: i18n.t('after or including'),
    [OPERATOR_LESS]: i18n.t('before'),
    [OPERATOR_LESS_OR_EQUAL]: i18n.t('before or including'),
    [OPERATOR_EMPTY]: i18n.t('is empty / null'),
    [OPERATOR_NOT_EMPTY]: i18n.t('is not empty / not null'),
})

export const getBooleanValues = () => ({
    [TRUE_VALUE]: i18n.t('Yes'),
    [FALSE_VALUE]: i18n.t('No'),
    [NULL_VALUE]: i18n.t('Not answered'),
})

export const API_TIME_DIVIDER = '.'
export const UI_TIME_DIVIDER = ':'
export const API_DATETIME_DIVIDER = 'T'
export const UI_DATETIME_DIVIDER = ' '

export const addCaseSensitivePrefix = (operator, isCaseSensitive: boolean) => {
    if (isCaseSensitive) {
        // e.g. LIKE -> LIKE
        return operator
    } else {
        if (operator[0] === PREFIX_NOT) {
            // e.g. !LIKE -> !ILIKE
            return `${PREFIX_NOT}${PREFIX_CASE_INSENSITIVE}${operator.substring(
                1
            )}`
        } else {
            // e.g. LIKE -> ILIKE
            return `${PREFIX_CASE_INSENSITIVE}${operator}`
        }
    }
}

export const removeCaseSensitivePrefix = (operator) => {
    const isCaseSensitive = checkIsCaseSensitive(operator)
    if (isCaseSensitive) {
        // e.g. LIKE -> LIKE, !LIKE -> !LIKE
        return operator
    } else {
        if (operator[0] === PREFIX_NOT) {
            // e.g. !ILIKE -> !LIKE
            return `${PREFIX_NOT}${operator.substring(2)}`
        } else {
            // e.g. ILIKE -> LIKE
            return `${operator.substring(1)}`
        }
    }
}

// TODO - in practice this function isn't used for the 'IN' operator
// but if it were the result would be wrong. The function
// should probably control for the allowed operators and throw if the
// operator isn't one of the allowed ones.
export const checkIsCaseSensitive = (operator) => {
    if (operator[0] === PREFIX_NOT) {
        // !LIKE, !ILIKE, !EQ, !IEQ
        return operator[1] !== PREFIX_CASE_INSENSITIVE
    } else {
        // LIKE, ILIKE, EQ, IEQ
        return operator[0] !== PREFIX_CASE_INSENSITIVE
    }
}

const getOperatorsByValueType = (valueType: SupportedValueType) => {
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

const lookupOptionSetOptionMetadata = (optionSetId, code, getMetadataItem) => {
    const optionSetMetaData = getMetadataItem(optionSetId)

    return optionSetMetaData
        ? optionSetMetaData.options?.find((option) => option.code === code)
        : undefined
}

interface GetConditionsTextsParams {
    conditions?: {
        condition?: string | string[]
        legendSet?: string
    }
    dimension?: LayoutDimension
    formatValueOptions?: {
        locale?: string
        digitGroupSeparator?: string
        baseUrl?: string
    }
    getMetadataItem: (id: string) => MetadataStoreItem | undefined
}

export const getConditionsTexts = ({
    conditions = {},
    dimension = {},
    formatValueOptions = {},
    getMetadataItem,
}) => {
    const conditionsList = parseConditionsStringToArray(conditions.condition)

    if (conditions.legendSet) {
        if (!conditionsList?.length) {
            return [metadata[conditions.legendSet]?.name]
        } else {
            const legends = parseCondition(conditionsList[0])
            const allLegends = metadata[conditions.legendSet]?.legends || []

            const legendNames = legends.map(
                (legend) => allLegends.find((l) => l.id === legend)?.name
            )
            return legendNames
        }
    }

    if (dimension.optionSet && conditionsList[0]?.startsWith(OPERATOR_IN)) {
        const items = parseCondition(conditionsList[0])

        const itemNames = items.map(
            (code) =>
                lookupOptionSetOptionMetadata(
                    dimension.optionSet,
                    code,
                    getMetadataItem
                )?.name
        )
        return itemNames
    }

    if (
        ['BOOLEAN', 'TRUE_ONLY'].includes(dimension.valueType) &&
        conditionsList[0]?.startsWith(OPERATOR_IN)
    ) {
        const values = parseCondition(conditionsList[0])
        const valueNames = values.map((value) => getBooleanValues()[value])
        return valueNames
    }

    if (
        dimension.valueType === 'ORGANISATION_UNIT' &&
        (conditionsList[0]?.startsWith(OPERATOR_EQUAL) ||
            conditionsList[0]?.startsWith(OPERATOR_IN))
    ) {
        const ouIds = parseCondition(conditionsList[0])
        const ouNames = ouIds.map(
            (ouId) =>
                getMetadataItem(ouId)?.name ??
                getMetadataItem(ouIdHelper.removePrefix(ouId))?.name ??
                // Default to showing the ID, but this should never happen
                ouId
        )
        return ouNames
    }

    const operators = getOperatorsByValueType(dimension.valueType)

    const parsedConditions = conditionsList.map((condition) => {
        let operator, value

        if (condition.includes(NULL_VALUE)) {
            operator = condition
        } else {
            const parts = condition.split(':')
            const valueType =
                dimension.dimensionType === 'PROGRAM_INDICATOR'
                    ? 'NUMBER'
                    : dimension.valueType
            operator = removeCaseSensitivePrefix(parts[0])
            value = formatValue(parts[1], valueType, formatValueOptions)
        }

        if (value && ['TIME', 'DATETIME'].includes(dimension.valueType)) {
            value = value.replaceAll(API_TIME_DIVIDER, UI_TIME_DIVIDER)
        }
        if (value && dimension.valueType === 'DATETIME') {
            value = value.replaceAll(API_DATETIME_DIVIDER, UI_DATETIME_DIVIDER)
        }

        const operatorName = operators[operator]
        const capitalCaseOperatorName =
            operatorName[0].toUpperCase() + operatorName.substring(1)
        return value
            ? `${capitalCaseOperatorName}: ${value}`
            : capitalCaseOperatorName
    })

    return parsedConditions
}
