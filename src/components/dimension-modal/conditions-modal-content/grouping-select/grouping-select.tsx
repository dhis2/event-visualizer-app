import i18n from '@dhis2/d2-i18n'
import { FieldSet, Legend, Radio } from '@dhis2/ui'
import { enterExactMode, setGroupLegendSet } from '@modules/display-mode'
import type { ConditionsObject } from '@store/vis-ui-config-slice'
import type { LegendSetMetadataItem } from '@types'
import { type FC } from 'react'
import classes from './styles/grouping-select.module.css'

const NONE_VALUE = 'NONE'
const RADIO_GROUP_NAME = 'grouping'
const SUBTITLE_PREVIEW_COUNT = 3

type GroupingLegendSet = {
    id: string
    name: string
    legends?: LegendSetMetadataItem['legends']
}

type GroupingSelectProps = {
    conditions: ConditionsObject
    legendSets: ReadonlyArray<GroupingLegendSet>
    onChange: (conditions: ConditionsObject) => void
}

const buildLegendPreview = (
    legends: LegendSetMetadataItem['legends'] | undefined
): string => {
    if (!legends?.length) {
        return ''
    }

    const names = [...legends]
        .sort((a, b) => a.startValue - b.startValue)
        .map((legend) => legend.name)

    const shown = names.slice(0, SUBTITLE_PREVIEW_COUNT)
    const remaining = names.length - shown.length

    return remaining > 0
        ? i18n.t('{{items}}, and {{count}} more', {
              items: shown.join(', '),
              count: remaining,
          })
        : shown.join(', ')
}

type GroupingCardProps = {
    value: string
    title: string
    subtitle: string
    checked: boolean
    onSelect: (value: string) => void
    dataTest: string
}

const GroupingCard: FC<GroupingCardProps> = ({
    value,
    title,
    subtitle,
    checked,
    onSelect,
    dataTest,
}) => (
    <Radio
        className={classes.card}
        name={RADIO_GROUP_NAME}
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        dense
        dataTest={dataTest}
        label={
            <span className={classes.cardText}>
                <span className={classes.cardTitle}>{title}</span>
                {subtitle ? (
                    <span className={classes.cardSubtitle} aria-hidden="true">
                        {subtitle}
                    </span>
                ) : null}
            </span>
        }
    />
)

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
                {legendSets.map(({ id, name, legends }) => (
                    <GroupingCard
                        key={id}
                        value={id}
                        title={name}
                        subtitle={buildLegendPreview(legends)}
                        checked={selected === id}
                        onSelect={handleSelect}
                        dataTest={`grouping-option-${id}`}
                    />
                ))}
                <GroupingCard
                    value={NONE_VALUE}
                    title={i18n.t('No grouping')}
                    subtitle={i18n.t('Show each value individually')}
                    checked={selected === NONE_VALUE}
                    onSelect={handleSelect}
                    dataTest="grouping-option-none"
                />
            </div>
        </FieldSet>
    )
}
