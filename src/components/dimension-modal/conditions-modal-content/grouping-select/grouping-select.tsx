import i18n from '@dhis2/d2-i18n'
import { FieldSet, Legend, Radio } from '@dhis2/ui'
import { enterExactMode, setGroupLegendSet } from '@modules/display-mode'
import type { ConditionsObject } from '@store/vis-ui-config-slice'
import { type FC } from 'react'
import classes from './styles/grouping-select.module.css'

const NONE_VALUE = 'NONE'
const RADIO_GROUP_NAME = 'grouping'

type GroupingSelectProps = {
    conditions: ConditionsObject
    legendSets: ReadonlyArray<{ id: string; name: string }>
    onChange: (conditions: ConditionsObject) => void
}

export const GroupingSelect: FC<GroupingSelectProps> = ({
    conditions,
    legendSets,
    onChange,
}) => {
    const selected = conditions.legendSet ?? NONE_VALUE

    const handleSelect = (value: string) =>
        onChange(
            value === NONE_VALUE ? enterExactMode() : setGroupLegendSet(value)
        )

    return (
        <FieldSet className={classes.container}>
            <Legend>
                <span className={classes.heading}>{i18n.t('Grouping')}</span>
            </Legend>
            <div className={classes.options} data-test="grouping-select">
                {legendSets.map(({ id, name }) => (
                    <Radio
                        key={id}
                        name={RADIO_GROUP_NAME}
                        label={name}
                        value={id}
                        checked={selected === id}
                        onChange={() => handleSelect(id)}
                        dense
                        dataTest={`grouping-option-${id}`}
                    />
                ))}
                <Radio
                    name={RADIO_GROUP_NAME}
                    label={i18n.t('None')}
                    value={NONE_VALUE}
                    checked={selected === NONE_VALUE}
                    onChange={() => handleSelect(NONE_VALUE)}
                    dense
                    dataTest="grouping-option-none"
                />
            </div>
        </FieldSet>
    )
}
