import i18n from '@dhis2/d2-i18n'
import {
    Button,
    IconDelete16,
    Input,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import {
    NULL_VALUE,
    UI_TIME_DIVIDER,
    API_TIME_DIVIDER,
    getDateOperators,
} from '@modules/conditions'
import { type ComponentProps, type FC } from 'react'
import classes from './styles/condition.module.css'
import { useValueInputFocus } from './use-value-input-focus'

type BaseConditionProps = {
    condition: string
    onChange: (value: string) => void
    onRemove: () => void
}

const BaseCondition: FC<
    BaseConditionProps & {
        type: ComponentProps<typeof Input>['type']
        max?: ComponentProps<typeof Input>['max']
    }
> = ({ condition, onChange, onRemove, type, max }) => {
    let operator, value

    if (condition.includes(NULL_VALUE)) {
        operator = condition
    } else {
        const parts = condition.split(':')
        operator = parts[0]
        value = parts[1]
    }

    const { valueInputId, focusValueInput } = useValueInputFocus()

    const setOperator = (input) => {
        if (input.includes(NULL_VALUE)) {
            onChange(`${input}`)
        } else {
            onChange(`${input}:${value || ''}`)
            focusValueInput()
        }
    }

    const setValue = (input) => {
        onChange(
            `${operator}:${
                input?.replaceAll(UI_TIME_DIVIDER, API_TIME_DIVIDER) || ''
            }`
        )
    }

    return (
        <div className={classes.container}>
            <SingleSelectField
                selected={operator}
                placeholder={i18n.t('Choose a filter type')}
                dense
                onChange={({ selected }) => setOperator(selected)}
                className={classes.operatorSelect}
            >
                {Object.entries(getDateOperators()).map(([key, value]) => (
                    <SingleSelectOption
                        key={key}
                        value={key}
                        label={value}
                        dataTest="date-condition-type"
                    />
                ))}
            </SingleSelectField>
            {operator && !operator.includes(NULL_VALUE) && (
                <Input
                    name={valueInputId}
                    value={value?.replaceAll(API_TIME_DIVIDER, UI_TIME_DIVIDER)}
                    type={type}
                    onChange={({ value }) => setValue(value)}
                    className={classes.dateInput}
                    max={max}
                    dense
                />
            )}
            <Button
                type="button"
                small
                secondary
                icon={<IconDelete16 />}
                onClick={onRemove}
                aria-label={i18n.t('Remove')}
                className={classes.removeButton}
                dataTest="condition-remove-button"
            />
        </div>
    )
}

export const DateCondition: FC<BaseConditionProps> = (props) => (
    <BaseCondition type="date" max="9999-12-31" {...props} />
)

export const DateTimeCondition: FC<BaseConditionProps> = (props) => (
    <BaseCondition type="datetime-local" max="9999-12-31T23:59:59" {...props} />
)

export const TimeCondition: FC<BaseConditionProps> = (props) => (
    <BaseCondition type="time" {...props} />
)
