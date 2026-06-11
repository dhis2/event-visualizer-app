import i18n from '@dhis2/d2-i18n'
import {
    Checkbox,
    Input,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
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
import { useCallback, useMemo, type FC } from 'react'
import { ConditionRemoveButton } from './condition-remove-button'
import classes from './styles/condition.module.css'
import { useValueInputFocus } from './use-value-input-focus'

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

    const { valueInputId, focusValueInput } = useValueInputFocus()

    const hasValueInput = Boolean(operator && !operator.includes(NULL_VALUE))

    const setOperator = useCallback(
        (input: QueryOperator) => {
            if (input.includes(NULL_VALUE)) {
                onChange(`${input}`)
            } else {
                onChange(
                    `${addCaseSensitivePrefix(input, isCaseSensitive)}:${
                        value || ''
                    }`
                )
                focusValueInput()
            }
        },
        [focusValueInput, isCaseSensitive, onChange, value]
    )

    const setValue = useCallback(
        (input?: string) => {
            onChange(
                `${addCaseSensitivePrefix(operator, isCaseSensitive)}:${
                    input || ''
                }`
            )
        },
        [isCaseSensitive, onChange, operator]
    )

    const toggleCaseSensitive = useCallback(
        (cs: boolean) => {
            onChange(`${addCaseSensitivePrefix(operator, cs)}:${value || ''}`)
        },
        [onChange, operator, value]
    )

    return (
        <div className={classes.container} data-test="alphanumeric-condition">
            <SingleSelectField
                selected={operator}
                placeholder={i18n.t('Choose a filter type')}
                dense
                onChange={({ selected }) =>
                    setOperator(selected as QueryOperator)
                }
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
            {hasValueInput && (
                <Input
                    name={valueInputId}
                    value={value}
                    type="text"
                    onChange={({ value }) => setValue(value)}
                    className={valueClassName || classes.textInput}
                    dense
                />
            )}
            {allowCaseSensitive &&
                operator &&
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
            <ConditionRemoveButton onClick={onRemove} />
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
