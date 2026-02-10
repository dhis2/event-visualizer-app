import i18n from '@dhis2/d2-i18n'
import { type FC, type ReactNode } from 'react'
import {
    PhoneNumberCondition,
    CaseSensitiveAlphanumericCondition,
    LetterCondition,
} from './alphanumeric-condition'
import { BooleanCondition, TrueOnlyCondition } from './boolean-condition'
import { useConditions } from './conditions-tab-content'
import {
    DateCondition,
    DateTimeCondition,
    TimeCondition,
} from './date-condition'
import { NumericCondition } from './numeric-condition/numeric-condition'
import { OptionSetCondition } from './option-set-condition/option-set-condition'
import { OrgUnitCondition } from './org-unit-condition'
import classes from './styles/conditions-modal-content.module.css'
import { PREFIX_CASE_INSENSITIVE } from '@modules/conditions'

const ConditionDivider: FC = () => (
    <span className={classes.separator}>{i18n.t('and')}</span>
)

const showConditionDivider = (total: number, index: number): boolean =>
    total > 1 && index < total - 1

export const Conditions: FC = () => {
    const {
        dimension,
        conditions,
        conditionsList,
        valueType,
        isOptionSetCondition,
        isProgramIndicator,
        setCondition,
        removeCondition,
    } = useConditions()

    const renderNumericCondition = ({
        enableDecimalSteps,
        allowIntegerOnly,
    }: {
        enableDecimalSteps?: boolean
        allowIntegerOnly?: boolean
    } = {}): ReactNode => {
        return (
            conditionsList.length
                ? conditionsList
                : conditions.legendSet
                ? // show the condition component also when no conditions are present but a legendSet is selected
                  ['']
                : []
        )?.map((condition, index) => (
            <div key={index}>
                <NumericCondition
                    dimension={dimension}
                    condition={condition}
                    onChange={(value, legendSet) =>
                        setCondition(index, value, legendSet)
                    }
                    onRemove={() => removeCondition(index)}
                    numberOfConditions={
                        conditionsList.length || (conditions.legendSet ? 1 : 0)
                    }
                    legendSetId={conditions.legendSet}
                    enableDecimalSteps={enableDecimalSteps}
                    allowIntegerOnly={allowIntegerOnly}
                />
                {showConditionDivider(conditionsList.length, index) && (
                    <ConditionDivider />
                )}
            </div>
        ))
    }

    if (isOptionSetCondition) {
        return conditionsList.map((condition, index) => (
            <div key={index}>
                <OptionSetCondition
                    condition={condition}
                    optionSetId={dimension.optionSet!}
                    onChange={(value) => setCondition(index, value)}
                />
            </div>
        ))
    }

    if (isProgramIndicator) {
        return renderNumericCondition()
    }

    switch (valueType) {
        case 'UNIT_INTERVAL': {
            return renderNumericCondition({ enableDecimalSteps: true })
        }
        case 'INTEGER':
        case 'INTEGER_POSITIVE':
        case 'INTEGER_NEGATIVE':
        case 'INTEGER_ZERO_OR_POSITIVE': {
            return renderNumericCondition({ allowIntegerOnly: true })
        }
        case 'NUMBER':
        case 'PERCENTAGE': {
            return renderNumericCondition()
        }
        case 'PHONE_NUMBER': {
            return conditionsList.map((condition, index) => (
                <div key={index}>
                    <PhoneNumberCondition
                        condition={condition}
                        onChange={(value) => setCondition(index, value)}
                        onRemove={() => removeCondition(index)}
                    />
                    {showConditionDivider(conditionsList.length, index) && (
                        <ConditionDivider />
                    )}
                </div>
            ))
        }
        case 'LETTER': {
            return conditionsList.map((condition, index) => (
                <div key={index}>
                    <LetterCondition
                        condition={condition}
                        onChange={(value) => setCondition(index, value)}
                        onRemove={() => removeCondition(index)}
                    />
                    {showConditionDivider(conditionsList.length, index) && (
                        <ConditionDivider />
                    )}
                </div>
            ))
        }
        case 'TEXT':
        case 'LONG_TEXT':
        case 'EMAIL':
        case 'USERNAME':
        case 'URL': {
            return conditionsList.map((condition, index) => (
                <div key={index}>
                    <CaseSensitiveAlphanumericCondition
                        condition={condition || `${PREFIX_CASE_INSENSITIVE}:`}
                        onChange={(value) => setCondition(index, value)}
                        onRemove={() => removeCondition(index)}
                    />
                    {showConditionDivider(conditionsList.length, index) && (
                        <ConditionDivider />
                    )}
                </div>
            ))
        }
        case 'BOOLEAN': {
            return conditionsList.map((condition, index) => (
                <div key={index}>
                    <BooleanCondition
                        condition={condition}
                        onChange={(value) => setCondition(index, value)}
                    />
                </div>
            ))
        }
        case 'TRUE_ONLY': {
            return conditionsList.map((condition, index) => (
                <div key={index}>
                    <TrueOnlyCondition
                        condition={condition}
                        onChange={(value) => setCondition(index, value)}
                    />
                </div>
            ))
        }
        case 'DATE': {
            return conditionsList.map((condition, index) => (
                <div key={index}>
                    <DateCondition
                        condition={condition}
                        onChange={(value) => setCondition(index, value)}
                        onRemove={() => removeCondition(index)}
                    />
                    {showConditionDivider(conditionsList.length, index) && (
                        <ConditionDivider />
                    )}
                </div>
            ))
        }
        case 'TIME': {
            return conditionsList.map((condition, index) => (
                <div key={index}>
                    <TimeCondition
                        condition={condition}
                        onChange={(value) => setCondition(index, value)}
                        onRemove={() => removeCondition(index)}
                    />
                    {showConditionDivider(conditionsList.length, index) && (
                        <ConditionDivider />
                    )}
                </div>
            ))
        }
        case 'DATETIME': {
            return conditionsList.map((condition, index) => (
                <div key={index}>
                    <DateTimeCondition
                        condition={condition}
                        onChange={(value) => setCondition(index, value)}
                        onRemove={() => removeCondition(index)}
                    />
                    {showConditionDivider(conditionsList.length, index) && (
                        <ConditionDivider />
                    )}
                </div>
            ))
        }
        case 'ORGANISATION_UNIT': {
            return conditionsList.map((condition, index) => (
                <div key={index}>
                    <OrgUnitCondition
                        condition={condition}
                        onChange={(value) => setCondition(index, value)}
                    />
                </div>
            ))
        }
    }
}
