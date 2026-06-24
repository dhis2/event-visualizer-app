import { ConditionRemoveButton } from '@components/dimension-modal/conditions-modal-content/condition-remove-button'
import classes from '@components/dimension-modal/conditions-modal-content/styles/condition.module.css'
import { useValueInputFocus } from '@components/dimension-modal/conditions-modal-content/use-value-input-focus'
import i18n from '@dhis2/d2-i18n'
import { Input, SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import { getNumericOperators, NULL_VALUE } from '@modules/conditions.js'
import type { DimensionMetadataItem } from '@types'
import { useCallback, useMemo, type FC } from 'react'

type NumericConditionProps = {
    condition: string
    onChange: (value: string) => void
    onRemove: () => void
    dimension: DimensionMetadataItem
}

export const NumericCondition: FC<NumericConditionProps> = ({
    condition,
    onChange,
    onRemove,
    dimension,
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
        } else {
            const parts = condition.split(':')
            return [parts[0], parts[1]]
        }
    }, [condition])

    const { valueInputId, focusValueInput } = useValueInputFocus()

    const setOperator = useCallback(
        (input: string) => {
            if (input.includes(NULL_VALUE)) {
                onChange(`${input}`)
            } else {
                onChange(`${input}:${value || ''}`)
                focusValueInput()
            }
        },
        [focusValueInput, onChange, value]
    )

    const setValue = useCallback(
        (input: number | string | undefined) => {
            onChange(`${operator}:${input || input === 0 ? input : ''}`)
        },
        [onChange, operator]
    )

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
                        dataTest="numeric-condition-type"
                    />
                ))}
            </SingleSelectField>
            {operator && !operator.includes(NULL_VALUE) && (
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
            <ConditionRemoveButton onClick={onRemove} />
        </div>
    )
}
