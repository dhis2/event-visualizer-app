import { useAppDispatch, useAppSelector } from '@hooks'
import {
    parseConditionsArrayToString,
    parseConditionsStringToArray,
} from '@modules/conditions'
import {
    getVisUiConfigConditionsByDimension,
    setVisUiConfigConditionsByDimension,
    type ConditionsObject,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem, ValueType } from '@types'
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type FC,
    type ReactNode,
} from 'react'

const EMPTY_CONDITION = ''

const SINGLETON_TYPES: Set<ValueType> = new Set([
    'BOOLEAN',
    'TRUE_ONLY',
    'ORGANISATION_UNIT',
])

const SUPPORTED_TYPES: Set<ValueType> = new Set([
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
])

type ConditionsContextValue = {
    dimension: DimensionMetadataItem
    conditions: ConditionsObject
    conditionsList: string[]
    valueType?: ValueType
    isLegendSetCondition: boolean
    isOptionSetCondition: boolean
    isProgramIndicator: boolean
    isSingleCondition: boolean
    isSupported: boolean
    setCondition: (conditionIndex: number, value: string) => void
    removeCondition: (conditionIndex: number) => void
    addCondition: () => void
    storeConditions: (conditionsList: string[]) => void
}

const ConditionsContext = createContext<ConditionsContextValue | undefined>(
    undefined
)

export const useConditions = (): ConditionsContextValue => {
    const context = useContext(ConditionsContext)

    if (!context) {
        throw new Error('useConditions must be used inside ConditionsProvider')
    }

    return context
}

type ConditionsProviderProps = {
    dimension: DimensionMetadataItem
    children: ReactNode
}

export const ConditionsProvider: FC<ConditionsProviderProps> = ({
    dimension,
    children,
}) => {
    const dispatch = useAppDispatch()

    const conditions = useAppSelector((state) =>
        getVisUiConfigConditionsByDimension(state, dimension?.id)
    )

    const valueType = dimension.valueType
    const isProgramIndicator: boolean =
        dimension.dimensionType === 'PROGRAM_INDICATOR'
    const isLegendSetCondition: boolean = Boolean(conditions.legendSet)
    const isOptionSetCondition: boolean = Boolean(dimension.optionSetId)
    const isSingleCondition: boolean = Boolean(
        isLegendSetCondition ||
        isOptionSetCondition ||
        (valueType && SINGLETON_TYPES.has(valueType))
    )
    const isSupported: boolean = Boolean(
        isProgramIndicator || (valueType && SUPPORTED_TYPES.has(valueType))
    )

    const [conditionsList, setConditionsList] = useState<string[]>(
        conditions.condition?.length
            ? parseConditionsStringToArray(conditions.condition)
            : [EMPTY_CONDITION]
    )

    const storeConditions = useCallback(
        (conditionsList: string[]) =>
            dispatch(
                setVisUiConfigConditionsByDimension({
                    dimensionId: dimension.id,
                    conditions: parseConditionsArrayToString(
                        conditionsList.filter(
                            (condition) =>
                                condition.length && !condition.endsWith(':')
                        )
                    ),
                })
            ),
        [dimension.id, dispatch]
    )

    const addCondition = useCallback(
        () => setConditionsList((prev) => [...prev, EMPTY_CONDITION]),
        []
    )

    const removeCondition = useCallback<
        ConditionsContextValue['removeCondition']
    >(
        (conditionIndex) =>
            setConditionsList((prev) => {
                const updatedConditionsList = prev.filter(
                    (_, index) => index !== conditionIndex
                )

                storeConditions(updatedConditionsList)

                return updatedConditionsList
            }),
        [storeConditions]
    )

    const setCondition = useCallback<ConditionsContextValue['setCondition']>(
        (conditionIndex, value) =>
            setConditionsList((prev) => {
                const updatedConditionsList = prev.map((condition, index) =>
                    index === conditionIndex ? value : condition
                )

                storeConditions(updatedConditionsList)

                return updatedConditionsList
            }),
        [storeConditions]
    )

    const contextValue = useMemo<ConditionsContextValue>(
        () => ({
            dimension,
            conditions,
            conditionsList,
            valueType,
            isLegendSetCondition,
            isOptionSetCondition,
            isProgramIndicator,
            isSingleCondition,
            isSupported,
            setCondition,
            removeCondition,
            addCondition,
            storeConditions,
        }),
        [
            dimension,
            conditions,
            conditionsList,
            valueType,
            isLegendSetCondition,
            isOptionSetCondition,
            isProgramIndicator,
            isSingleCondition,
            isSupported,
            setCondition,
            removeCondition,
            addCondition,
            storeConditions,
        ]
    )

    return (
        <ConditionsContext.Provider value={contextValue}>
            {children}
        </ConditionsContext.Provider>
    )
}
