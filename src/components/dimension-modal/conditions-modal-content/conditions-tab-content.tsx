import i18n from '@dhis2/d2-i18n'
import {
    DropdownButton,
    FlyoutMenu,
    MenuDivider,
    MenuItem,
    Radio,
    Tooltip,
} from '@dhis2/ui'
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
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem, ValueType } from '@types'
import {
    type FC,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { Conditions } from './conditions'
import classes from './styles/conditions-modal-content.module.css'

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

const FILTER_MODE_ALL = 'all'
const FILTER_MODE_FILTER = 'filter'
type FilterMode = typeof FILTER_MODE_ALL | typeof FILTER_MODE_FILTER

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
            : isSingleCondition || conditions.legendSet
              ? [EMPTY_CONDITION]
              : []
    )

    const [mode, setMode] = useState<FilterMode>(() =>
        conditions.condition?.length || conditions.legendSet
            ? FILTER_MODE_FILTER
            : FILTER_MODE_ALL
    )

    const [stashedLegendSet, setStashedLegendSet] = useState<
        string | undefined
    >(conditions.legendSet)

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

    const onModeChange = useCallback(
        (newMode: FilterMode) => {
            if (newMode === FILTER_MODE_ALL) {
                setStashedLegendSet(conditions.legendSet)
                dispatch(
                    setVisUiConfigConditionsByDimension({
                        dimensionId: dimension.id,
                        conditions: '',
                        legendSet: undefined,
                    })
                )
            } else {
                storeConditions(conditionsList, stashedLegendSet)
            }
            setMode(newMode)
        },
        [
            conditions.legendSet,
            conditionsList,
            stashedLegendSet,
            dispatch,
            dimension.id,
            storeConditions,
        ]
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

    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
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

    const toggleDropdown = useCallback(
        () => setIsDropdownOpen((open) => !open),
        []
    )

    const addCondition = useCallback(
        (operatorKey: QueryOperator) => {
            setIsDropdownOpen(false)
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
        initialFocusIndex,
        setCondition,
        removeCondition,
    ])

    if (!isSupported) {
        return (
            <ConditionsProvider.Provider value={providerValue}>
                <p className={classes.paragraph}>
                    {i18n.t(
                        "This dimension can't be filtered. All values will be shown."
                    )}
                </p>
            </ConditionsProvider.Provider>
        )
    }

    const radioName = `condition-mode-${dimension.id}`

    return (
        <ConditionsProvider.Provider value={providerValue}>
            <div className={classes.conditionsContent}>
                <div className={classes.modeRadios}>
                    <div
                        className={`${classes.modeCard} ${
                            mode === FILTER_MODE_ALL
                                ? classes.modeCardActive
                                : ''
                        }`}
                    >
                        <Radio
                            name={radioName}
                            label={i18n.t('Show all values')}
                            value={FILTER_MODE_ALL}
                            checked={mode === FILTER_MODE_ALL}
                            onChange={({ value }) =>
                                onModeChange(value as FilterMode)
                            }
                            dense
                            dataTest="condition-mode-all"
                        />
                    </div>
                    <div
                        className={`${classes.modeCard} ${
                            mode === FILTER_MODE_FILTER
                                ? classes.modeCardActive
                                : ''
                        }`}
                    >
                        <Radio
                            name={radioName}
                            label={i18n.t('Filter by...')}
                            value={FILTER_MODE_FILTER}
                            checked={mode === FILTER_MODE_FILTER}
                            onChange={({ value }) =>
                                onModeChange(value as FilterMode)
                            }
                            dense
                            dataTest="condition-mode-filter"
                        />
                        <div className={classes.filterBodyWrap}>
                            <div className={classes.filterBodyInner}>
                                <div className={classes.filterBody}>
                                    {(conditionsList.length ||
                                        conditions.legendSet ||
                                        isSingleCondition) && <Conditions />}
                                    {!isSingleCondition && (
                                        <Tooltip
                                            content={i18n.t(
                                                "Preset options can't be combined with other conditions"
                                            )}
                                            placement="bottom"
                                            closeDelay={200}
                                        >
                                            {({
                                                onMouseOver,
                                                onMouseOut,
                                                ref,
                                            }) => (
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
                                                    className={
                                                        classes.tooltipReference
                                                    }
                                                >
                                                    <DropdownButton
                                                        type="button"
                                                        small
                                                        secondary
                                                        open={isDropdownOpen}
                                                        onClick={toggleDropdown}
                                                        className={
                                                            classes.addConditionButton
                                                        }
                                                        disabled={
                                                            disableAddButton
                                                        }
                                                        dataTest="button-add-condition"
                                                        component={
                                                            <FlyoutMenu
                                                                dense
                                                                dataTest="add-condition-menu"
                                                            >
                                                                {Object.entries(
                                                                    dropdownOperators
                                                                ).map(
                                                                    ([
                                                                        key,
                                                                        label,
                                                                    ]) => (
                                                                        <MenuItem
                                                                            key={
                                                                                key
                                                                            }
                                                                            label={
                                                                                label
                                                                            }
                                                                            onClick={() =>
                                                                                addCondition(
                                                                                    key as QueryOperator
                                                                                )
                                                                            }
                                                                            dataTest={`add-condition-menu-item-${key}`}
                                                                        />
                                                                    )
                                                                )}
                                                                {canHaveLegendSets && (
                                                                    <>
                                                                        <MenuDivider
                                                                            dense
                                                                        />
                                                                        {/* Stricter than disableAddButton: once any condition exists, the IN operator is not offered at all, since it is mutually exclusive with every other operator. */}
                                                                        <MenuItem
                                                                            dense
                                                                            label={i18n.t(
                                                                                'is one of preset options'
                                                                            )}
                                                                            disabled={
                                                                                conditionsList.length >
                                                                                0
                                                                            }
                                                                            onClick={() =>
                                                                                addCondition(
                                                                                    OPERATOR_IN
                                                                                )
                                                                            }
                                                                            dataTest={`add-condition-menu-item-${OPERATOR_IN}`}
                                                                        />
                                                                    </>
                                                                )}
                                                            </FlyoutMenu>
                                                        }
                                                    >
                                                        {conditionsList.length
                                                            ? i18n.t(
                                                                  'Add another condition'
                                                              )
                                                            : i18n.t(
                                                                  'Add a condition'
                                                              )}
                                                    </DropdownButton>
                                                </span>
                                            )}
                                        </Tooltip>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ConditionsProvider.Provider>
    )
}
