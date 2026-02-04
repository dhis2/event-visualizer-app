import i18n from '@dhis2/d2-i18n'
import {
    SingleSelectField,
    SingleSelectOption,
    Button,
    Input,
    MultiSelectField,
    MultiSelectOption,
    MenuDivider,
} from '@dhis2/ui'
import { useCallback, useEffect, useMemo, useState, type FC } from 'react'
import { legendSetsApi } from './legend-sets-api'
import classes from '@components/dimension-modal/conditions-modal-content/styles/condition.module.css'
import { useAddMetadata, useLegendSetMetadataItem } from '@hooks'
import {
    getNumericOperators,
    NULL_VALUE,
    OPERATOR_IN,
} from '@modules/conditions.js'
import type { DimensionMetadataItem, LegendSetMetadataItem } from '@types'

type NumericConditionProps = {
    condition: string
    numberOfConditions: number
    onChange: (value: string, legendSet?: string) => void
    onRemove: () => void
    allowIntegerOnly?: boolean
    dimension: DimensionMetadataItem
    enableDecimalSteps?: boolean
    legendSetId?: string
}

export const NumericCondition: FC<NumericConditionProps> = ({
    condition,
    onChange,
    onRemove,
    legendSetId,
    numberOfConditions,
    enableDecimalSteps,
    dimension,
    allowIntegerOnly,
}) => {
    let operator: string = '',
        value: string = ''

    if (condition.includes(NULL_VALUE)) {
        operator = condition
    } else if (legendSetId && !condition) {
        operator = OPERATOR_IN
    } else {
        const parts = condition.split(':')
        operator = parts[0]
        value = parts[1]
    }

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

        return options
    }, [legendSet, legendSetId, legendSetMetadata?.legends])

    useEffect(() => {
        if (legendSet) {
            addMetadata({ [dimension.id]: { legendSet: legendSet.id } })
            addMetadata(legendSet as LegendSetMetadataItem)
        }
    }, [dimension.id, legendSet, addMetadata])

    const setOperator = (input: string) => {
        if (input.includes(NULL_VALUE)) {
            onChange(`${input}`)
            // here we "remove" value if the previous operator is "IN"
            // so we can clear legend ids from the value which do not make sense when the selected operator is not "IN"
            // we also clear the internal selectedLegendSetId
        } else if (operator === OPERATOR_IN) {
            onChange(`${input}:`)
            setSelectedLegendSetId(undefined)
        } else if (input === OPERATOR_IN) {
            onChange(`${input}:`, selectedLegendSetId)
        } else {
            onChange(`${input}:${value || ''}`)
        }
    }

    const setValue = (
        input: number | string | undefined,
        legendSetId?: string
    ) => {
        onChange(
            `${operator}:${input || input === 0 ? input : ''}`,
            legendSetId
        )

        setSelectedLegendSetId(legendSetId ?? undefined)
    }

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
                placeholder={i18n.t('Choose a condition type')}
                dense
                onChange={({ selected }) => setOperator(selected)}
                className={classes.operatorSelect}
            >
                {Object.entries(getNumericOperators()).map(([key, value]) => (
                    <SingleSelectOption
                        key={key}
                        value={key}
                        label={value}
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
                                availableLegendSetLegends
                                    .sort((a, b) => a.startValue - b.startValue)
                                    .map((legend) => (
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
            <Button
                type="button"
                small
                secondary
                onClick={onRemove}
                className={classes.removeButton}
            >
                {i18n.t('Remove')}
            </Button>
        </div>
    )
}
