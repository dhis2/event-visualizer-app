import i18n from '@dhis2/d2-i18n'
import { Button, IconInfo16, Tooltip } from '@dhis2/ui'
import {
    type FC,
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import { Conditions } from './conditions'
import classes from './styles/conditions-modal-content.module.css'
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
    valueType: ValueType
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
    const isOptionSetCondition: boolean = Boolean(dimension.optionSet)
    const isSingleCondition: boolean =
        SINGLETON_TYPES.includes(valueType) || isOptionSetCondition
    const isSupported: boolean =
        SUPPORTED_TYPES.includes(valueType) || isProgramIndicator
    const canHaveLegendSets: boolean =
        isValueTypeNumeric(valueType) || isProgramIndicator

    const [conditionsList, setConditionsList] = useState<string[]>(
        conditions.condition?.length
            ? parseConditionsStringToArray(conditions.condition)
            : isSingleCondition || conditions.legendSet
            ? [EMPTY_CONDITION]
            : []
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

    return (
        <ConditionsProvider.Provider value={providerValue}>
            <div>
                {isSupported ? (
                    <p className={classes.paragraph}>
                        {i18n.t(
                            'Show items that meet the following conditions for this data item:',
                            { nsSeparator: '^^' }
                        )}
                    </p>
                ) : (
                    <p className={classes.paragraph}>
                        {i18n.t(
                            "This dimension can't be filtered. All values will be shown."
                        )}
                    </p>
                )}
            </div>
            {isSupported && (
                <div className={classes.mainSection}>
                    {!conditionsList.length &&
                    !conditions.legendSet &&
                    !isSingleCondition ? (
                        <p className={classes.paragraph}>
                            <span className={classes.infoIcon}>
                                <IconInfo16 />
                            </span>
                            {i18n.t(
                                'No conditions yet, so all values will be included. Add a condition to filter results.'
                            )}
                        </p>
                    ) : (
                        <Conditions />
                    )}
                    {!isSingleCondition && (
                        <Tooltip
                            content={i18n.t(
                                "Preset options can't be combined with other conditions"
                            )}
                            placement="bottom"
                            closeDelay={200}
                        >
                            {({ onMouseOver, onMouseOut, ref }) => (
                                <span
                                    ref={ref}
                                    onMouseOver={(event) =>
                                        disableAddButton && onMouseOver(event)
                                    }
                                    onMouseOut={(event) =>
                                        disableAddButton && onMouseOut(event)
                                    }
                                    className={classes.tooltipReference}
                                >
                                    <Button
                                        type="button"
                                        small
                                        onClick={addCondition}
                                        className={classes.addConditionButton}
                                        disabled={disableAddButton}
                                        dataTest="button-add-condition"
                                    >
                                        {conditionsList.length
                                            ? i18n.t('Add another condition')
                                            : i18n.t('Add a condition')}
                                    </Button>
                                </span>
                            )}
                        </Tooltip>
                    )}
                </div>
            )}
        </ConditionsProvider.Provider>
    )
}
