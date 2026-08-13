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
    getVisUiConfigConditionsByDimension,
    setVisUiConfigConditionsByDimension,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem, ValueType } from '@types'
import { type FC, useCallback, useMemo, useState } from 'react'
import { Conditions } from './conditions'
import {
    ConditionsContext,
    type ConditionsContextValue,
} from './conditions-context'
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

type FilteringSectionProps = {
    dimension: DimensionMetadataItem
    showHeading: boolean
}

export const FilteringSection: FC<FilteringSectionProps> = ({
    dimension,
    showHeading,
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

    const contextValue: ConditionsContextValue = useMemo(() => {
        return {
            dimension,
            conditions,
            conditionsList,
            isLegendSetCondition,
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
        isLegendSetCondition,
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
    const showAllLabel = isLegendSetCondition
        ? i18n.t('Show all groups')
        : undefined

    return (
        <ConditionsContext.Provider value={contextValue}>
            {isSupported ? (
                <ShowAllFilterRadio
                    mode={mode}
                    onModeChange={onModeChange}
                    heading={heading}
                    showAllLabel={showAllLabel}
                    dataTest={`conditions-${dimension.id}-filter-radio`}
                >
                    <div className={classes.mainSection}>
                        <Conditions />
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
        </ConditionsContext.Provider>
    )
}
