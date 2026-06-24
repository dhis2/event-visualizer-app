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
import { usePrototypeGroupingDefaultOnOpen } from '@modules/prototype-default-grouping'
import { isValueTypeNumeric } from '@modules/value-type'
import {
    type ConditionsObject,
    getVisUiConfigConditionsByDimension,
    setVisUiConfigConditionsByDimension,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem, ValueType } from '@types'
import {
    type FC,
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import { Conditions } from './conditions'
import { GroupingSelect } from './grouping-select/grouping-select'
import classes from './styles/conditions-modal-content.module.css'
import { useDimensionLegendSets } from './use-dimension-legend-sets'

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
    setCondition: (
        conditionIndex: number,
        value: string,
        legendSet?: string
    ) => void
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

    const { legendSets, legendSetCount, defaultLegendSetId } =
        useDimensionLegendSets(dimension, canHaveLegendSets)

    // PROTOTYPE ONLY
    usePrototypeGroupingDefaultOnOpen({
        dimensionId: dimension.id,
        canHaveLegendSets,
        defaultLegendSetId,
    })

    const showGroupingSelect = canHaveLegendSets && legendSetCount >= 1
    /* When grouped, the only filter is a single "is one of preset options" band
     * selection, so adding further operator conditions is disabled. */
    const disableAddButton = Boolean(conditions.legendSet)

    const [conditionsList, setConditionsList] = useState<string[]>(
        conditions.condition?.length
            ? parseConditionsStringToArray(conditions.condition)
            : [EMPTY_CONDITION]
    )

    const storeConditions = useCallback(
        (conditionsList: string[], legendSet?: string) =>
            dispatch(
                setVisUiConfigConditionsByDimension({
                    dimensionId: dimension.id,
                    conditions: parseConditionsArrayToString(
                        conditionsList.filter(
                            (condition) =>
                                condition.length && condition.slice(-1) !== ':'
                        )
                    ),
                    legendSet,
                })
            ),
        [dimension.id, dispatch]
    )

    /* The Filter (Show all/Filter) toggles the operator/band condition only;
     * the grouping legendSet is set by the Grouping select and persists across
     * the toggle. conditionsList is local state so it survives the toggle on its
     * own — only the persisted condition needs restoring. */
    const hasPersistedFilter: boolean = Boolean(conditions.condition?.length)

    const onEnterShowAll = useCallback(() => {
        storeConditions([], conditions.legendSet)
    }, [conditions.legendSet, storeConditions])

    const onEnterFilter = useCallback(() => {
        storeConditions(conditionsList, conditions.legendSet)
    }, [conditionsList, conditions.legendSet, storeConditions])

    const { mode, onModeChange, resetMode } = useFilterRadioMode({
        hasPersistedFilter,
        onEnterShowAll,
        onEnterFilter,
    })

    /* Changing the Grouping select rewrites the conditions wholesale: it sets
     * (or clears) the legendSet and nukes any operator/band condition, snapping
     * the Filter back to "Show all" — the operator and band payloads don't
     * convert, so a leftover filter would read as phantom state. */
    const onGroupingChange = useCallback(
        (next: ConditionsObject) => {
            setConditionsList([EMPTY_CONDITION])
            storeConditions([], next.legendSet)
            resetMode('SHOW_ALL')
        },
        [storeConditions, resetMode]
    )

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

                storeConditions(updatedConditionsList, conditions.legendSet)

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

    return (
        <ConditionsProvider.Provider value={providerValue}>
            {showGroupingSelect && (
                <GroupingSelect
                    conditions={conditions}
                    legendSets={legendSets}
                    onChange={onGroupingChange}
                />
            )}
            {isSupported ? (
                <ShowAllFilterRadio
                    mode={mode}
                    onModeChange={onModeChange}
                    dataTest={`conditions-${dimension.id}-filter-radio`}
                    heading={showGroupingSelect ? i18n.t('Filter') : undefined}
                >
                    <div className={classes.mainSection}>
                        <Conditions />
                        {!isSingleCondition && (
                            <Button
                                type="button"
                                small
                                onClick={addCondition}
                                disabled={disableAddButton}
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
                    dataTest={`conditions-${dimension.id}-filter-radio`}
                    filterDisabled
                    filterDisabledHelp={filterDisabledHelp}
                />
            )}
        </ConditionsProvider.Provider>
    )
}
