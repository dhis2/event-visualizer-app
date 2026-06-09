import { ShowAllFilterRadio } from '@components/dimension-modal/show-all-filter-radio/show-all-filter-radio'
import { useFilterRadioMode } from '@components/dimension-modal/show-all-filter-radio/use-filter-radio-mode'
import { valueTypeDisplayNames } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { Button, Tooltip } from '@dhis2/ui'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    OPERATOR_IN,
    parseConditionsArrayToString,
    parseConditionsStringToArray,
} from '@modules/conditions'
import { isValueTypeNumeric } from '@modules/value-type'
import {
    type ConditionsObject,
    getVisUiConfigConditionsByDimension,
    setVisUiConfigConditionsByDimension,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem, ValueType } from '@types'
import cx from 'classnames'
import {
    type FC,
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Conditions } from './conditions'
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

    const [conditionsList, setConditionsList] = useState<string[]>(
        conditions.condition?.length
            ? parseConditionsStringToArray(conditions.condition)
            : [EMPTY_CONDITION]
    )

    const disableAddButton: boolean =
        canHaveLegendSets &&
        (conditionsList.some((condition) => condition.includes(OPERATOR_IN)) ||
            Boolean(conditions.legendSet))

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

    const hasPersistedFilter: boolean = Boolean(
        conditions.condition?.length || conditions.legendSet
    )
    /* conditionsList is local state, so it survives the "Show all"/"Filter"
     * toggle on its own. The legendSet lives in the persisted conditions, which
     * "Show all" clears, so it's the only piece that needs stashing to restore
     * when switching back to "Filter". */
    const legendSetStashRef = useRef<string | undefined>(conditions.legendSet)

    const onEnterShowAll = useCallback(() => {
        legendSetStashRef.current = conditions.legendSet
        storeConditions([], undefined)
    }, [conditions.legendSet, storeConditions])

    const onEnterFilter = useCallback(() => {
        storeConditions(conditionsList, legendSetStashRef.current)
    }, [conditionsList, storeConditions])

    const { mode, onModeChange } = useFilterRadioMode({
        hasPersistedFilter,
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
            {isSupported ? (
                <ShowAllFilterRadio
                    mode={mode}
                    onModeChange={onModeChange}
                    dataTest={`conditions-${dimension.id}-filter-radio`}
                >
                    <div className={classes.mainSection}>
                        <Conditions />
                        {!isSingleCondition && (
                            <Tooltip
                                content={i18n.t(
                                    "Preset options can't be combined with other filters"
                                )}
                                placement="bottom"
                                closeDelay={200}
                            >
                                {({ onMouseOver, onMouseOut, ref }) => (
                                    <span
                                        ref={ref}
                                        onMouseOver={(event) =>
                                            disableAddButton &&
                                            onMouseOver(event)
                                        }
                                        onMouseOut={(event) =>
                                            disableAddButton &&
                                            onMouseOut(event)
                                        }
                                        className={cx(
                                            classes.tooltipReference,
                                            {
                                                [classes.tooltipReferenceFirst]:
                                                    !conditionsList.length,
                                            }
                                        )}
                                    >
                                        <Button
                                            type="button"
                                            small
                                            onClick={addCondition}
                                            className={
                                                classes.addConditionButton
                                            }
                                            disabled={disableAddButton}
                                            dataTest="button-add-condition"
                                        >
                                            {i18n.t('Add filter')}
                                        </Button>
                                    </span>
                                )}
                            </Tooltip>
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
