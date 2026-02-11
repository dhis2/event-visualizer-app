import i18n from '@dhis2/d2-i18n'
import {
    Button,
    Checkbox,
    Input,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import { useCallback, useMemo, type FC } from 'react'
import classes from './styles/condition.module.css'
import {
    NULL_VALUE,
    OPERATOR_EMPTY,
    OPERATOR_NOT_EMPTY,
    PREFIX_CASE_INSENSITIVE,
    addCaseSensitivePrefix,
    removeCaseSensitivePrefix,
    isIsCaseSensitive,
    getAlphaNumericOperators,
    type QueryOperator,
} from '@modules/conditions'

type ConditionProps = {
    condition: string
    onChange: (condition: string) => void
    onRemove: () => void
}

const BaseCondition: FC<
    ConditionProps & {
        allowCaseSensitive?: boolean
        valueClassName?: string
    }
> = ({ condition, onChange, onRemove, allowCaseSensitive, valueClassName }) => {
    const [operator, value, isCaseSensitive] = useMemo(() => {
        if (condition.includes(NULL_VALUE)) {
            return [condition as QueryOperator, '', false]
        } else {
            const parts = condition.split(':')
            return [
                removeCaseSensitivePrefix(parts[0] as QueryOperator),
                parts[1],
                isIsCaseSensitive(parts[0] as QueryOperator),
            ]
        }
    }, [condition])

    const setOperator = useCallback(
        (input) => {
            if (input.includes(NULL_VALUE)) {
                onChange(`${input}`)
            } else {
                onChange(
                    `${addCaseSensitivePrefix(input, isCaseSensitive)}:${
                        value || ''
                    }`
                )
            }
        },
        [isCaseSensitive, onChange, value]
    )

    const setValue = useCallback(
        (input) => {
            onChange(
                `${addCaseSensitivePrefix(operator, isCaseSensitive)}:${
                    input || ''
                }`
            )
        },
        [isCaseSensitive, onChange, operator]
    )

    const toggleCaseSensitive = useCallback(
        (cs) => {
            onChange(`${addCaseSensitivePrefix(operator, cs)}:${value || ''}`)
        },
        [onChange, operator, value]
    )

    return (
        <div className={classes.container} data-test="alphanumeric-condition">
            <SingleSelectField
                selected={operator}
                placeholder={i18n.t('Choose a condition type')}
                dense
                onChange={({ selected }) => setOperator(selected)}
                className={classes.operatorSelect}
            >
                {Object.entries(getAlphaNumericOperators()).map(
                    ([key, value]) => (
                        <SingleSelectOption
                            key={key}
                            value={key}
                            label={value}
                            dataTest="alphanumeric-condition-type"
                        />
                    )
                )}
            </SingleSelectField>
            {operator && !operator.includes(NULL_VALUE) && (
                <Input
                    value={value}
                    type="text"
                    onChange={({ value }) => setValue(value)}
                    className={valueClassName || classes.textInput}
                    dense
                />
            )}
            {allowCaseSensitive &&
                ![OPERATOR_EMPTY, OPERATOR_NOT_EMPTY].includes(operator) && (
                    <Checkbox
                        checked={isCaseSensitive}
                        label={i18n.t('Case sensitive')}
                        onChange={({ checked }) => toggleCaseSensitive(checked)}
                        dense
                        className={classes.caseSensitiveCheckbox}
                        dataTest="condition-case-sensitive-checkbox"
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

export const PhoneNumberCondition: FC<ConditionProps> = (props) => (
    <BaseCondition valueClassName={classes.phoneNumberInput} {...props} />
)

export const LetterCondition: FC<ConditionProps> = (props) => (
    <BaseCondition
        valueClassName={classes.letterInput}
        allowCaseSensitive={true}
        {...props}
    />
)

export const CaseSensitiveAlphanumericCondition: FC<ConditionProps> = (
    props
) => {
    const { condition, ...rest } = props
    return (
        <BaseCondition
            {...rest}
            allowCaseSensitive={true}
            condition={condition || `${PREFIX_CASE_INSENSITIVE}`}
        />
    )
}
