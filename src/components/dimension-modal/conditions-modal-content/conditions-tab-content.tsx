import { useAppDispatch, useAppSelector } from '@hooks'
import {
    OPERATOR_EMPTY,
    OPERATOR_IN,
    OPERATOR_NOT_EMPTY,
    type QueryOperator,
    addCaseSensitivePrefix,
    getOperatorsForDimension,
    isAlphanumericValueType,
    parseConditionsArrayToString,
    parseConditionsStringToArray,
} from '@modules/conditions'
import { isValueTypeNumeric } from '@modules/value-type'
import {
    type ConditionsObject,
    getVisUiConfigConditionsByDimension,
    setVisUiConfigConditionsByDimension,
    setVisUiConfigLegendSetByDimension,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem, ValueType } from '@types'
import {
    type FC,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { DataSection } from './data-section'

const buildInitialConditionString = (
    operatorKey: QueryOperator,
    isAlphanumeric: boolean
): string => {
    if (operatorKey === OPERATOR_EMPTY || operatorKey === OPERATOR_NOT_EMPTY) {
        return operatorKey
    }

    // Alphanumeric dimensions default to case-insensitive, which means the
    // stored operator is prefixed with "I" (e.g. LIKE -> ILIKE, EQ -> IEQ).
    const prefixedOperator = isAlphanumeric
        ? addCaseSensitivePrefix(operatorKey, false)
        : operatorKey

    return `${prefixedOperator}:`
}

const EMPTY_CONDITION = ''

const SINGLETON_TYPES: ValueType[] = [
    'BOOLEAN',
    'TRUE_ONLY',
    'ORGANISATION_UNIT',
]

// List of supported types for conditions
const SUPPORTED_TYPES: ValueType[] = [
    'NUMBER',
    'UNIT_INTERVAL',
    'PERCENTAGE',
    'INTEGER',
    'INTEGER_POSITIVE',
    'INTEGER_NEGATIVE',
    'INTEGER_ZERO_OR_POSITIVE',
    'TEXT',
    'LONG_TEXT',
    'LETTER',
    'PHONE_NUMBER',
    'EMAIL',
    'USERNAME',
    'URL',
    'BOOLEAN',
    'TRUE_ONLY',
    'DATE',
    'TIME',
    'DATETIME',
    'ORGANISATION_UNIT',
]

type ConditionsProviderValue = {
    dimension: DimensionMetadataItem
    conditions: ConditionsObject
    conditionsList: string[]
    valueType?: ValueType
    isOptionSetCondition: boolean
    isProgramIndicator: boolean
    isSupported: boolean
    initialFocusIndex: number | null
    dropdownOperators: Record<string, string>
    canHaveLegendSets: boolean
    addCondition: (operatorKey: QueryOperator) => void
    setCondition: (
        conditionIndex: number,
        value: string,
        legendSet?: string
    ) => void
    setLegendSet: (legendSet?: string) => void
    removeCondition: (conditionIndex: number) => void
}

const ConditionsProvider = createContext<ConditionsProviderValue | undefined>(
    undefined
)

export const useConditions = (): ConditionsProviderValue => {
    const context = useContext(ConditionsProvider)

    if (!context) {
        throw new Error(
            'useConditions must be used inside ConditionsModalContent'
        )
    }

    return context
}

type ConditionsTabContentProps = {
    dimension: DimensionMetadataItem
}

export const ConditionsTabContent: FC<ConditionsTabContentProps> = ({
    dimension,
}) => {
    const dispatch = useAppDispatch()

    const conditions = useAppSelector((state) =>
        getVisUiConfigConditionsByDimension(state, dimension?.id)
    )

    const valueType = dimension.valueType
    const isProgramIndicator: boolean =
        dimension.dimensionType === 'PROGRAM_INDICATOR'
    const isOptionSetCondition: boolean = Boolean(dimension.optionSetId)
    const isSingleCondition: boolean = Boolean(
        isOptionSetCondition ||
        (valueType && SINGLETON_TYPES.includes(valueType))
    )
    const isSupported: boolean = Boolean(
        isProgramIndicator || (valueType && SUPPORTED_TYPES.includes(valueType))
    )
    const canHaveLegendSets: boolean = Boolean(
        isProgramIndicator || (valueType && isValueTypeNumeric(valueType))
    )

    const [conditionsList, setConditionsList] = useState<string[]>(
        conditions.condition?.length
            ? parseConditionsStringToArray(conditions.condition)
            : isSingleCondition
              ? [EMPTY_CONDITION]
              : []
    )

    /* Re-sync local conditionsList when Redux conditions change externally
     * (e.g. via the data-section toggle clearing/restoring drafts, or via the
     * legend-set section dropping IN: entries). The ref tracks what we last
     * wrote to Redux ourselves so we don't loop on our own dispatches. */
    const lastSyncedRef = useRef<string>(conditions.condition ?? '')
    useEffect(() => {
        const fromRedux = conditions.condition ?? ''
        if (fromRedux === lastSyncedRef.current) {
            return
        }
        lastSyncedRef.current = fromRedux
        const next = fromRedux.length
            ? parseConditionsStringToArray(fromRedux)
            : isSingleCondition
              ? [EMPTY_CONDITION]
              : []
        setConditionsList(next)
    }, [conditions.condition, isSingleCondition])

    const storeConditions = useCallback(
        (conditionsList: string[], legendSet?: string) => {
            const next = parseConditionsArrayToString(
                conditionsList.filter(
                    (condition) =>
                        condition.length && condition.slice(-1) !== ':'
                )
            )
            // Track what we just wrote so the external-change effect doesn't fire.
            lastSyncedRef.current = next
            dispatch(
                setVisUiConfigConditionsByDimension({
                    dimensionId: dimension.id,
                    conditions: next,
                    legendSet,
                })
            )
        },
        [dimension.id, dispatch]
    )

    const isAlphanumeric: boolean =
        !isProgramIndicator && isAlphanumericValueType(valueType)

    const dropdownOperators = useMemo(
        () =>
            getOperatorsForDimension({
                valueType,
                dimensionType: dimension.dimensionType,
            }),
        [valueType, dimension.dimensionType]
    )

    const [initialFocusIndex, setInitialFocusIndex] = useState<number | null>(
        null
    )

    // Consume-once: clear the flag after the child mounts with initialFocus so
    // a subsequent re-render doesn't try to steal focus again.
    useEffect(() => {
        if (initialFocusIndex !== null) {
            setInitialFocusIndex(null)
        }
    }, [initialFocusIndex])

    const addCondition = useCallback(
        (operatorKey: QueryOperator) => {
            const initialCondition = buildInitialConditionString(
                operatorKey,
                isAlphanumeric
            )
            const updated = [...conditionsList, initialCondition]
            setConditionsList(updated)
            // storeConditions drops entries ending with ':', so operator-only
            // placeholders stay local; complete conditions (EQ:NV, NE:NV) persist.
            storeConditions(updated, conditions.legendSet)
            // Focus the value input of the newly-added condition. Skip operators
            // that don't take a value (NV) or open a separate picker flow (IN).
            const shouldFocus =
                operatorKey !== OPERATOR_EMPTY &&
                operatorKey !== OPERATOR_NOT_EMPTY &&
                operatorKey !== OPERATOR_IN
            setInitialFocusIndex(shouldFocus ? updated.length - 1 : null)
        },
        [conditionsList, isAlphanumeric, storeConditions, conditions.legendSet]
    )

    const removeCondition = useCallback<
        ConditionsProviderValue['removeCondition']
    >(
        (conditionIndex) =>
            setConditionsList((prev) => {
                const updatedConditionsList = prev.filter(
                    (_, index) => index !== conditionIndex
                )

                const hasInOperator = updatedConditionsList.some((condition) =>
                    condition.includes(OPERATOR_IN)
                )

                const nextLegendSet = hasInOperator
                    ? conditions.legendSet
                    : undefined

                storeConditions(updatedConditionsList, nextLegendSet)

                return updatedConditionsList
            }),
        [conditions.legendSet, storeConditions]
    )

    const setCondition = useCallback<ConditionsProviderValue['setCondition']>(
        (conditionIndex, value, legendSet) =>
            setConditionsList((prev) => {
                const updatedConditionsList = prev.map((condition, index) =>
                    index === conditionIndex ? value : condition
                )

                storeConditions(updatedConditionsList, legendSet)

                return updatedConditionsList
            }),
        [storeConditions]
    )

    const setLegendSet = useCallback<ConditionsProviderValue['setLegendSet']>(
        (legendSet) => {
            const isLegendSetChanging = legendSet !== conditions.legendSet
            const updatedConditionsList = isLegendSetChanging
                ? legendSet && !conditions.legendSet
                    ? conditionsList.filter((condition) =>
                          condition.includes(OPERATOR_IN)
                      )
                    : conditionsList.filter(
                          (condition) => !condition.includes(OPERATOR_IN)
                      )
                : conditionsList

            setConditionsList(updatedConditionsList)
            dispatch(
                setVisUiConfigLegendSetByDimension({
                    dimensionId: dimension.id,
                    legendSet,
                })
            )
        },
        [conditions.legendSet, conditionsList, dimension.id, dispatch]
    )

    const providerValue: ConditionsProviderValue = useMemo(() => {
        return {
            dimension,
            conditions,
            conditionsList,
            isOptionSetCondition,
            isProgramIndicator,
            isSupported,
            valueType,
            initialFocusIndex,
            dropdownOperators,
            canHaveLegendSets,
            addCondition,
            setCondition,
            setLegendSet,
            removeCondition,
        }
    }, [
        dimension,
        conditions,
        conditionsList,
        isOptionSetCondition,
        isProgramIndicator,
        isSupported,
        valueType,
        initialFocusIndex,
        dropdownOperators,
        canHaveLegendSets,
        addCondition,
        setCondition,
        setLegendSet,
        removeCondition,
    ])

    return (
        <ConditionsProvider.Provider value={providerValue}>
            <DataSection />
        </ConditionsProvider.Provider>
    )
}
