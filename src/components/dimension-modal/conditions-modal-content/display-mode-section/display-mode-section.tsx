import {
    RadioCard,
    RadioCardGroup,
} from '@components/dimension-modal/radio-card/radio-card'
import i18n from '@dhis2/d2-i18n'
import {
    FieldSet,
    Legend,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import {
    enterExactMode,
    enterGroupMode,
    getDisplayMode,
    setGroupLegendSet,
} from '@modules/display-mode'
import type { ConditionsObject } from '@store/vis-ui-config-slice'
import { type FC } from 'react'
import classes from './styles/display-mode-section.module.css'

type DisplayModeSectionProps = {
    conditions: ConditionsObject
    legendSets: ReadonlyArray<{ id: string; name: string }>
    defaultLegendSetId: string
    onChange: (conditions: ConditionsObject) => void
}

export const DisplayModeSection: FC<DisplayModeSectionProps> = ({
    conditions,
    legendSets,
    defaultLegendSetId,
    onChange,
}) => {
    const displayMode = getDisplayMode(conditions)
    const radioGroupName = 'display-mode'

    return (
        <FieldSet className={classes.section}>
            <Legend>
                <span className={classes.heading}>{i18n.t('Display')}</span>
            </Legend>
            <RadioCardGroup>
                <RadioCard
                    selected={displayMode === 'EXACT'}
                    label={i18n.t('Exact values')}
                    value="EXACT"
                    name={radioGroupName}
                    dataTest="display-mode-exact"
                    onSelect={() => {
                        if (displayMode !== 'EXACT') {
                            onChange(enterExactMode())
                        }
                    }}
                />
                <RadioCard
                    selected={displayMode === 'GROUP'}
                    label={i18n.t('Group into ranges')}
                    value="GROUP"
                    name={radioGroupName}
                    dataTest="display-mode-group"
                    onSelect={() => {
                        if (displayMode !== 'GROUP') {
                            onChange(enterGroupMode(defaultLegendSetId))
                        }
                    }}
                >
                    {legendSets.length > 1 ? (
                        <SingleSelectField
                            label={i18n.t('Ranges from:')}
                            selected={conditions.legendSet}
                            dense
                            onChange={({ selected }) =>
                                onChange(setGroupLegendSet(selected))
                            }
                            dataTest="display-mode-legend-set-select"
                        >
                            {legendSets.map(({ id, name }) => (
                                <SingleSelectOption
                                    key={id}
                                    value={id}
                                    label={name}
                                />
                            ))}
                        </SingleSelectField>
                    ) : (
                        <span className={classes.rangesFromStatic}>
                            {i18n.t('Ranges from:')}{' '}
                            <span className={classes.rangesFromName}>
                                {legendSets[0]?.name}
                            </span>
                        </span>
                    )}
                </RadioCard>
            </RadioCardGroup>
        </FieldSet>
    )
}
