import { ShowAllFilterRadio } from '@components/dimension-modal/show-all-filter-radio/show-all-filter-radio'
import { useFilterRadioMode } from '@components/dimension-modal/show-all-filter-radio/use-filter-radio-mode'
import { valueTypeDisplayNames } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { Button } from '@dhis2/ui'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    parseConditionsArrayToString,
    parseConditionsStringToArray,
} from '@modules/conditions'
import {
    type ConditionsObject,
    getVisUiConfigConditionsByDimension,
    setVisUiConfigConditionsByDimension,
} from '@store/vis-ui-config-slice'
import type {
    DimensionMetadataItem,
    LegendSetMetadataItem,
    ValueType,
} from '@types'
import {
    type FC,
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import { Conditions } from './conditions'
import { LegendCondition } from './legend-condition/legend-condition'
import classes from './styles/conditions-modal-content.module.css'

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
    setCondition: (conditionIndex: number, value: string) => void
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

type FilterSectionProps = {
    dimension: DimensionMetadataItem
    /* Legends of the selected legend set. Undefined while they are still being
     * fetched, so it cannot stand in for "is this dimension grouped". */
    groupingLegends?: LegendSetMetadataItem['legends']
    showHeading: boolean
}

const NO_LEGENDS: LegendSetMetadataItem['legends'] = []

export const FilterSection: FC<FilterSectionProps> = ({
    dimension,
    groupingLegends,
    showHeading,
}) => {
    const dispatch = useAppDispatch()

    const conditions = useAppSelector((state) =>
        getVisUiConfigConditionsByDimension(state, dimension?.id)
    )

    const isGrouped = Boolean(conditions.legendSet)
    const valueType = dimension.valueType
    const isProgramIndicator: boolean =
        dimension.dimensionType === 'PROGRAM_INDICATOR'
    const isOptionSetCondition: boolean = Boolean(dimension.optionSetId)
    const isSingleCondition: boolean = Boolean(
        isGrouped ||
        isOptionSetCondition ||
        (valueType && SINGLETON_TYPES.includes(valueType))
    )
    const isSupported: boolean = Boolean(
        isProgramIndicator || (valueType && SUPPORTED_TYPES.includes(valueType))
    )

    const [conditionsList, setConditionsList] = useState<string[]>(
        conditions.condition?.length
            ? parseConditionsStringToArray(conditions.condition)
            : [EMPTY_CONDITION]
    )

    /* The legend set is owned by the grouping section, so it is passed straight
     * back through every conditions update. */
    const storeConditions = useCallback(
        (conditionsList: string[]) =>
            dispatch(
                setVisUiConfigConditionsByDimension({
                    dimensionId: dimension.id,
                    conditions: parseConditionsArrayToString(
                        conditionsList.filter(
                            (condition) =>
                                condition.length && condition.slice(-1) !== ':'
                        )
                    ),
                    legendSet: conditions.legendSet,
                })
            ),
        [dimension.id, dispatch, conditions.legendSet]
    )

    const onEnterShowAll = useCallback(
        () => storeConditions([]),
        [storeConditions]
    )

    const onEnterFilter = useCallback(
        () => storeConditions(conditionsList),
        [conditionsList, storeConditions]
    )

    const { mode, onModeChange } = useFilterRadioMode({
        hasPersistedFilter: Boolean(conditions.condition?.length),
        onEnterShowAll,
        onEnterFilter,
    })

    const addCondition = (): void => {
        setConditionsList((prev) => [...prev, EMPTY_CONDITION])
    }

    const removeCondition = useCallback<
        ConditionsProviderValue['removeCondition']
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

    const setCondition = useCallback<ConditionsProviderValue['setCondition']>(
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

    const providerValue: ConditionsProviderValue = useMemo(() => {
        return {
            dimension,
            conditions,
            conditionsList,
            isOptionSetCondition,
            isProgramIndicator,
            isSupported,
            valueType,
            setCondition,
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
        setCondition,
        removeCondition,
    ])

    const filterDisabledHelp = valueType
        ? i18n.t('{{valueType}} type dimensions cannot be filtered.', {
              valueType: valueTypeDisplayNames[valueType],
          })
        : i18n.t('This dimension cannot be filtered.')

    const heading = showHeading ? i18n.t('Filtering') : undefined
    const showAllLabel = isGrouped ? i18n.t('Show all groups') : undefined

    return (
        <ConditionsProvider.Provider value={providerValue}>
            {isSupported ? (
                <ShowAllFilterRadio
                    mode={mode}
                    onModeChange={onModeChange}
                    heading={heading}
                    showAllLabel={showAllLabel}
                    dataTest={`conditions-${dimension.id}-filter-radio`}
                >
                    <div className={classes.mainSection}>
                        {isGrouped ? (
                            <LegendCondition
                                condition={conditionsList[0] ?? EMPTY_CONDITION}
                                legends={groupingLegends ?? NO_LEGENDS}
                                onChange={(value) => setCondition(0, value)}
                            />
                        ) : (
                            <Conditions />
                        )}
                        {!isSingleCondition && (
                            <Button
                                type="button"
                                small
                                onClick={addCondition}
                                dataTest="button-add-condition"
                            >
                                {i18n.t('Add filter')}
                            </Button>
                        )}
                    </div>
                </ShowAllFilterRadio>
            ) : (
                <ShowAllFilterRadio
                    mode="SHOW_ALL"
                    onModeChange={() => {
                        /* unfilterable dimensions are always "Show all" */
                    }}
                    heading={heading}
                    dataTest={`conditions-${dimension.id}-filter-radio`}
                    filterDisabled
                    filterDisabledHelp={filterDisabledHelp}
                />
            )}
        </ConditionsProvider.Provider>
    )
}
