import { ConditionRemoveButton } from '@components/dimension-modal/conditions-modal-content/condition-remove-button'
import classes from '@components/dimension-modal/conditions-modal-content/styles/condition.module.css'
import { useValueInputFocus } from '@components/dimension-modal/conditions-modal-content/use-value-input-focus'
import i18n from '@dhis2/d2-i18n'
import {
    Input,
    MenuDivider,
    MultiSelect,
    MultiSelectOption,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import {
    getNumericOperators,
    NULL_VALUE,
    OPERATOR_IN,
} from '@modules/conditions.js'
import type { DimensionMetadataItem } from '@types'
import { useCallback, useMemo, type FC } from 'react'
import { legendSetsApi } from './legend-sets-api'

type NumericConditionProps = {
    condition: string
    onChange: (value: string) => void
    onRemove: () => void
    dimension: DimensionMetadataItem
    /* The grouping legend set (from the "Grouping" select). When set, the
     * dimension is grouped into that set's ranges, so the only available filter
     * operator is "is one of preset options" (a multi-select of its bands). */
    legendSetId?: string
}

export const NumericCondition: FC<NumericConditionProps> = ({
    condition,
    onChange,
    onRemove,
    dimension,
    legendSetId,
}) => {
    const isGrouped = Boolean(legendSetId)

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
        }
        // grouped with no band selection yet: default to the preset operator so
        // the band multi-select shows immediately (it's the only enabled one)
        if (isGrouped && !condition) {
            return [OPERATOR_IN, '']
        }
        const parts = condition.split(':')
        return [parts[0], parts[1]]
    }, [condition, isGrouped])

    const { data: legendSet, isFetching } = legendSetsApi.useGetLegendSetQuery(
        legendSetId ?? '',
        { skip: !legendSetId }
    )

    const bands = useMemo(
        () =>
            [...(legendSet?.legends ?? [])].sort(
                (a, b) => a.startValue - b.startValue
            ),
        [legendSet]
    )

    const { valueInputId, focusValueInput } = useValueInputFocus()

    const setOperator = useCallback(
        (input: string) => {
            if (input.includes(NULL_VALUE)) {
                onChange(`${input}`)
            } else if (input === OPERATOR_IN) {
                onChange(`${input}:`)
            } else if (operator === OPERATOR_IN) {
                // leaving the preset operator: drop the band ids
                onChange(`${input}:`)
                focusValueInput()
            } else {
                onChange(`${input}:${value || ''}`)
                focusValueInput()
            }
        },
        [focusValueInput, onChange, operator, value]
    )

    const setValue = useCallback(
        (input: number | string | undefined) => {
            onChange(`${operator}:${input || input === 0 ? input : ''}`)
        },
        [onChange, operator]
    )

    const selectedBands = value ? value.split(';') : []

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
                        disabled={isGrouped}
                        dataTest="numeric-condition-type"
                    />
                ))}
                <MenuDivider dense />
                <SingleSelectOption
                    key={OPERATOR_IN}
                    value={OPERATOR_IN}
                    label={i18n.t('is one of preset options')}
                    disabled={!isGrouped}
                    dataTest="numeric-condition-type"
                />
            </SingleSelectField>
            {operator &&
                !operator.includes(NULL_VALUE) &&
                operator !== OPERATOR_IN && (
                    <Input
                        name={valueInputId}
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
                <div className={classes.legendSelect}>
                    <MultiSelect
                        collapseSelectionAfter={0}
                        selected={selectedBands}
                        onChange={({ selected }) =>
                            onChange(`${OPERATOR_IN}:${selected.join(';')}`)
                        }
                        loading={isFetching}
                        placeholder={i18n.t('Choose ranges')}
                        loadingText={i18n.t('Loading ranges')}
                        dense
                    >
                        {bands.map((legend) => (
                            <MultiSelectOption
                                key={legend.id}
                                value={legend.id}
                                label={legend.name}
                            />
                        ))}
                    </MultiSelect>
                </div>
            )}
            <ConditionRemoveButton onClick={onRemove} />
        </div>
    )
}
