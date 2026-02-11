import i18n from '@dhis2/d2-i18n'
import type { ComponentType, FC } from 'react'
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

const ConditionDivider: FC<{ total: number; index: number }> = ({
    total,
    index,
}) =>
    total > 1 && index < total - 1 ? (
        <span className={classes.separator}>{i18n.t('and')}</span>
    ) : null

type ConditionComponentProps = {
    condition: string
    onChange: (value: string) => void
    onRemove?: (index: number) => void
}

const ConditionsList: FC<{
    conditionComponent: ComponentType<ConditionComponentProps>
}> = ({ conditionComponent: ConditionComponent }) => {
    const { conditionsList, setCondition, removeCondition } = useConditions()

    return conditionsList.map((condition, index) => (
        <div key={index}>
            <ConditionComponent
                condition={condition}
                onChange={(value) => setCondition(index, value)}
                onRemove={() => removeCondition(index)}
            />
            <ConditionDivider total={conditionsList.length} index={index} />
        </div>
    ))
}

const NumericConditionsList: FC = () => {
    const {
        conditionsList,
        conditions,
        dimension,
        removeCondition,
        setCondition,
    } = useConditions()

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
            />
            <ConditionDivider total={conditionsList.length} index={index} />
        </div>
    ))
}

export const Conditions: FC = () => {
    const {
        dimension,
        conditionsList,
        valueType,
        isOptionSetCondition,
        isProgramIndicator,
        setCondition,
    } = useConditions()

    if (isOptionSetCondition) {
        return (
            <OptionSetCondition
                condition={conditionsList[0]}
                optionSetId={dimension.optionSet!}
                onChange={(value) => setCondition(0, value)}
            />
        )
    }

    if (isProgramIndicator) {
        return <NumericConditionsList />
    }

    switch (valueType) {
        case 'UNIT_INTERVAL':
        case 'INTEGER':
        case 'INTEGER_POSITIVE':
        case 'INTEGER_NEGATIVE':
        case 'INTEGER_ZERO_OR_POSITIVE':
        case 'NUMBER':
        case 'PERCENTAGE': {
            return <NumericConditionsList />
        }
        case 'PHONE_NUMBER': {
            return <ConditionsList conditionComponent={PhoneNumberCondition} />
        }
        case 'LETTER': {
            return <ConditionsList conditionComponent={LetterCondition} />
        }
        case 'TEXT':
        case 'LONG_TEXT':
        case 'EMAIL':
        case 'USERNAME':
        case 'URL': {
            return (
                <ConditionsList
                    conditionComponent={CaseSensitiveAlphanumericCondition}
                />
            )
        }
        case 'BOOLEAN': {
            return <ConditionsList conditionComponent={BooleanCondition} />
        }
        case 'TRUE_ONLY': {
            return <ConditionsList conditionComponent={TrueOnlyCondition} />
        }
        case 'DATE': {
            return <ConditionsList conditionComponent={DateCondition} />
        }
        case 'TIME': {
            return <ConditionsList conditionComponent={TimeCondition} />
        }
        case 'DATETIME': {
            return <ConditionsList conditionComponent={DateTimeCondition} />
        }
        case 'ORGANISATION_UNIT': {
            return <ConditionsList conditionComponent={OrgUnitCondition} />
        }
    }
}
