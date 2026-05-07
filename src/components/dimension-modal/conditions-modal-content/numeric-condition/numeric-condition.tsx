import classes from '@components/dimension-modal/conditions-modal-content/styles/condition.module.css'
import i18n from '@dhis2/d2-i18n'
import {
    IconDelete16,
    Input,
    MenuDivider,
    MultiSelectField,
    MultiSelectOption,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import { useAddMetadata, useLegendSetMetadataItem } from '@hooks'
import {
    getNumericOperators,
    NULL_VALUE,
    OPERATOR_IN,
    type QueryOperator,
} from '@modules/conditions.js'
import type { DimensionMetadataItem, LegendSetMetadataItem } from '@types'
import { useCallback, useEffect, useMemo, useState, type FC } from 'react'
import { legendSetsApi } from './legend-sets-api'

type NumericConditionProps = {
    condition: string
    numberOfConditions: number
    onChange: (value: string, legendSet?: string) => void
    onRemove: () => void
    dimension: DimensionMetadataItem
    legendSetId?: string
    initialFocus?: boolean
}

type NumericConditionPlaceholderProps = {
    operators: Record<string, string>
    onSelectOperator: (operatorKey: QueryOperator) => void
    showLegendSetOperator?: boolean
}

export const NumericConditionPlaceholder: FC<
    NumericConditionPlaceholderProps
> = ({ operators, onSelectOperator, showLegendSetOperator = false }) => (
    <div className={classes.container} data-test="condition-placeholder">
        <SingleSelectField
            selected={undefined}
            placeholder={i18n.t('Choose an operator')}
            dense
            onChange={({ selected }) =>
                onSelectOperator(selected as QueryOperator)
            }
            className={classes.operatorSelect}
        >
            {Object.entries(operators).map(([key, value]) => (
                <SingleSelectOption
                    key={key}
                    value={key}
                    label={value}
                    dataTest="condition-placeholder-operator"
                />
            ))}
            {showLegendSetOperator && Object.keys(operators).length > 0 && (
                <MenuDivider dense />
            )}
            {showLegendSetOperator && (
                <SingleSelectOption
                    key={OPERATOR_IN}
                    value={OPERATOR_IN}
                    label={i18n.t('is one of preset options')}
                    dataTest="condition-placeholder-operator"
                />
            )}
        </SingleSelectField>
        <Input
            value=""
            type="number"
            disabled
            className={classes.numericInput}
            dense
        />
        <button
            type="button"
            className={classes.removeIconButton}
            aria-label={i18n.t('Remove')}
            data-test="condition-remove-button"
            disabled
        >
            <IconDelete16 />
        </button>
    </div>
)

export const NumericCondition: FC<NumericConditionProps> = ({
    condition,
    onChange,
    onRemove,
    legendSetId,
    numberOfConditions,
    dimension,
    initialFocus,
}) => {
    const allowIntegerOnly: boolean = useMemo(
        () =>
            Boolean(
                dimension.valueType &&
                [
                    'INTEGER',
                    'INTEGER_POSITIVE',
                    'INTEGER_NEGATIVE',
                    'INTEGER_ZERO_OR_POSITIVE',
                ].includes(dimension.valueType)
            ),
        [dimension.valueType]
    )

    const enableDecimalSteps: boolean = useMemo(
        () => dimension.valueType === 'UNIT_INTERVAL',
        [dimension.valueType]
    )

    const [operator, value] = useMemo(() => {
        if (condition.includes(NULL_VALUE)) {
            return [condition, '']
        } else if (legendSetId && !condition) {
            return [OPERATOR_IN, '']
        } else {
            const parts = condition.split(':')
            return [parts[0], parts[1]]
        }
    }, [condition, legendSetId])

    const [
        fetchLegendSets,
        {
            data: legendSets,
            isLoading: isLoadingLegendSets,
            isFetching: isFetchingLegendSets,
        },
    ] = legendSetsApi.useLazyGetLegendSetsByDimensionQuery()
    const [
        fetchLegendSet,
        {
            data: legendSet,
            isLoading: isLoadingLegendSet,
            isFetching: isFetchingLegendSet,
        },
    ] = legendSetsApi.useLazyGetLegendSetQuery()

    const addMetadata = useAddMetadata()
    const [selectedLegendSetId, setSelectedLegendSetId] = useState(legendSetId)

    useEffect(() => {
        setSelectedLegendSetId(legendSetId)
    }, [legendSetId])

    const legendSetMetadata = useLegendSetMetadataItem(legendSetId)

    const availableLegendSets = useMemo(() => {
        const options = [] as { id: string; name?: string }[]

        if (Array.isArray(legendSets)) {
            options.push(...legendSets)
        }

        if (legendSetId) {
            if (!options.find((option) => option.id === legendSetId)) {
                options.push({
                    id: legendSetId,
                    name: legendSetMetadata?.name,
                })
            }
        }

        return options
    }, [legendSets, legendSetId, legendSetMetadata?.name])

    const availableLegendSetLegends = useMemo(() => {
        const options = [] as LegendSetMetadataItem['legends']

        if (Array.isArray(legendSet?.legends)) {
            options.push(...legendSet.legends)
        }

        if (legendSetId && Array.isArray(legendSetMetadata?.legends)) {
            legendSetMetadata.legends.forEach((legend) => {
                if (!options.find((option) => option.id === legend.id)) {
                    options.push(legend)
                }
            })
        }

        return options.sort((a, b) => a.startValue - b.startValue)
    }, [legendSet, legendSetId, legendSetMetadata?.legends])

    useEffect(() => {
        if (legendSet) {
            addMetadata({ [dimension.id]: { legendSet: legendSet.id } })
        }
    }, [dimension.id, legendSet, addMetadata])

    const setOperator = useCallback(
        (input: string) => {
            if (input.includes(NULL_VALUE)) {
                onChange(`${input}`)
            } else if (input === OPERATOR_IN) {
                onChange(`${input}:`, selectedLegendSetId)
            } else if (operator === OPERATOR_IN) {
                // here we "remove" value if the previous operator is "IN"
                // so we can clear legend ids from the value which do not make sense when the selected operator is not "IN"
                // we also clear the internal selectedLegendSetId
                onChange(`${input}:`)
                setSelectedLegendSetId(undefined)
            } else {
                onChange(`${input}:${value || ''}`)
            }
        },
        [onChange, operator, selectedLegendSetId, value]
    )

    const setValue = useCallback(
        (input: number | string | undefined, legendSetId?: string) => {
            onChange(
                `${operator}:${input || input === 0 ? input : ''}`,
                legendSetId
            )

            setSelectedLegendSetId(legendSetId ?? undefined)
        },
        [onChange, operator]
    )

    const onLegendSetDropdownFocus = useCallback(() => {
        if (!legendSets) {
            fetchLegendSets({
                dimensionId: dimension.id,
                dimensionType: dimension.dimensionType,
            })
        }
    }, [fetchLegendSets, dimension.id, dimension.dimensionType, legendSets])

    const onLegendSetLegendsDropdownFocus = useCallback(() => {
        if (!legendSet && selectedLegendSetId) {
            fetchLegendSet(selectedLegendSetId)
        }
    }, [fetchLegendSet, selectedLegendSetId, legendSet])

    return (
        <div className={classes.container}>
            <SingleSelectField
                selected={operator}
                placeholder={i18n.t('Choose a filter type')}
                dense
                onChange={({ selected }) => setOperator(selected)}
                className={classes.operatorSelect}
            >
                {Object.entries(getNumericOperators()).map(([key, value]) => (
                    <SingleSelectOption
                        key={key}
                        value={key}
                        label={value}
                        disabled={Boolean(legendSetId)}
                        dataTest="numeric-condition-type"
                    />
                ))}
                <MenuDivider dense />
                <SingleSelectOption
                    key={OPERATOR_IN}
                    value={OPERATOR_IN}
                    label={i18n.t('is one of preset options')}
                    disabled={numberOfConditions > 1}
                    dataTest="numeric-condition-type"
                />
            </SingleSelectField>
            {operator &&
                !operator.includes(NULL_VALUE) &&
                operator !== OPERATOR_IN && (
                    <Input
                        value={value}
                        type="number"
                        onChange={({ value }) =>
                            setValue(
                                value == null
                                    ? undefined
                                    : allowIntegerOnly
                                      ? parseInt(value, 10)
                                      : value
                            )
                        }
                        className={classes.numericInput}
                        dense
                        step={enableDecimalSteps ? '0.1' : '1'}
                        initialFocus={initialFocus}
                    />
                )}
            {operator === OPERATOR_IN && (
                <>
                    <SingleSelectField
                        selected={selectedLegendSetId}
                        onChange={({ selected }) => {
                            setValue(undefined, selected)
                        }}
                        onFocus={onLegendSetDropdownFocus}
                        loading={isLoadingLegendSets || isFetchingLegendSets}
                        placeholder={i18n.t('Choose a legend set')}
                        loadingText={i18n.t('Loading legend sets')}
                        empty={i18n.t(
                            'No preset option sets for this data item'
                        )}
                        className={classes.legendSetSelect}
                        dense
                    >
                        {Array.isArray(availableLegendSets) &&
                            availableLegendSets?.map((item) => (
                                <SingleSelectOption
                                    key={item.id}
                                    value={item.id}
                                    label={item.name!}
                                />
                            ))}
                    </SingleSelectField>
                    {selectedLegendSetId && (
                        <MultiSelectField
                            selected={
                                Array.isArray(availableLegendSets) &&
                                availableLegendSets.length &&
                                value.length
                                    ? value.split(';')
                                    : []
                            }
                            onChange={({ selected }) =>
                                setValue(
                                    selected.join(';'),
                                    selectedLegendSetId
                                )
                            }
                            onFocus={onLegendSetLegendsDropdownFocus}
                            loading={isLoadingLegendSet || isFetchingLegendSet}
                            placeholder={i18n.t('Choose legends')}
                            loadingText={i18n.t('Loading legends')}
                            className={classes.legendSelect}
                            dense
                        >
                            {Array.isArray(availableLegendSetLegends) &&
                                availableLegendSetLegends.map((legend) => (
                                    <MultiSelectOption
                                        key={legend.id}
                                        value={legend.id}
                                        label={legend.name}
                                    />
                                ))}
                        </MultiSelectField>
                    )}
                </>
            )}
            <button
                type="button"
                onClick={onRemove}
                className={classes.removeIconButton}
                aria-label={i18n.t('Remove')}
                data-test="condition-remove-button"
            >
                <IconDelete16 />
            </button>
        </div>
    )
}
