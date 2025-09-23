import i18n from '@dhis2/d2-i18n'
import { IconLegend24, Button } from '@dhis2/ui'
import { useCallback, useState, type FC } from 'react'
import classes from './styles/legend-key.module.css'
import { LegendKey as UiLegendKey } from '@dhis2/analytics'
import type { LegendSet } from '@types'

type LegendKeyProps = {
    isInDashboard: boolean
    legendSets: LegendSet[]
    showKey?: boolean
}

const LegendKeyWithVisibilityToggle: FC<
    Pick<LegendKeyProps, 'legendSets' | 'showKey'>
> = ({ showKey, legendSets }) => {
    const [showLegendKey, setShowLegendKey] = useState(showKey)
    const toggleLegendKey = useCallback(() => {
        setShowLegendKey((currentShowLegendKey) => !currentShowLegendKey)
    }, [])

    return (
        <div className={classes.legendKeyContainer}>
            <div className={classes.legendKeyToggle}>
                <Button
                    small
                    secondary
                    onClick={toggleLegendKey}
                    icon={<IconLegend24 />}
                    toggled={showLegendKey}
                    title={
                        showLegendKey
                            ? i18n.t('Hide legend key')
                            : i18n.t('Show legend key')
                    }
                />
            </div>
            {showLegendKey && (
                <div
                    className={classes.legendKeyWrapper}
                    data-test="visualization-legend-key"
                >
                    <UiLegendKey legendSets={legendSets} />
                </div>
            )}
        </div>
    )
}

export const LegendKey: FC<LegendKeyProps> = ({
    isInDashboard,
    legendSets,
    showKey = false,
}) => {
    if (legendSets.length === 0 || (!isInDashboard && !showKey)) {
        return null
    } else if (isInDashboard) {
        return (
            <LegendKeyWithVisibilityToggle
                legendSets={legendSets}
                showKey={showKey}
            />
        )
    } else {
        return (
            <div
                className={classes.legendKeyScrollbox}
                data-test="visualization-legend-key"
            >
                <UiLegendKey legendSets={legendSets} />
            </div>
        )
    }
}
