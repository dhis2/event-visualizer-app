import i18n from '@dhis2/d2-i18n'
import { SingleSelectField, SingleSelectOption, Button, Input } from '@dhis2/ui'
import type { ComponentProps, FC } from 'react'
import classes from './styles/condition.module.css'
import {
    NULL_VALUE,
    UI_TIME_DIVIDER,
    API_TIME_DIVIDER,
    getDateOperators,
} from '@modules/conditions'

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

    const setOperator = (input) => {
        if (input.includes(NULL_VALUE)) {
            onChange(`${input}`)
        } else {
            onChange(`${input}:${value || ''}`)
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
                placeholder={i18n.t('Choose a condition type')}
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
                onClick={onRemove}
                className={classes.removeButton}
            >
                {i18n.t('Remove')}
            </Button>
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
