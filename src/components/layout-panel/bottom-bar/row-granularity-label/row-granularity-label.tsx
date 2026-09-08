import { IconTableRows } from '@components/layout-panel/bottom-bar/icon-table-rows'
import { getProgramCountTooltipConfig } from '@components/layout-panel/bottom-bar/program-count-tooltip-config'
import { WithTooltip } from '@components/layout-panel/bottom-bar/with-tooltip'
import i18n from '@dhis2/d2-i18n'
import { useAppSelector, useLayoutContext, useOutputTypeLabel } from '@hooks'
import { getVisUiConfigOutputType } from '@store/vis-ui-config-slice'
import cx from 'classnames'
import { type FC } from 'react'
import classes from './styles/row-granularity-label.module.css'

export const RowGranularityLabel: FC = () => {
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const outputTypeLabel = useOutputTypeLabel(outputType)
    const { programIds } = useLayoutContext()
    /* A tracked entity list spans programs by design; an event or enrollment
     * list cannot, so with any other program count it describes a granularity
     * the layout can no longer produce. */
    const tooltipConfig =
        outputType === 'TRACKED_ENTITY_INSTANCE'
            ? undefined
            : getProgramCountTooltipConfig(programIds)

    return (
        <WithTooltip tooltipConfig={tooltipConfig}>
            <span
                className={cx(classes.label, {
                    [classes.unavailable]: Boolean(tooltipConfig),
                })}
                data-test="row-granularity-label"
            >
                <IconTableRows />
                {i18n.t('One row for each {{- outputTypeLabel}}', {
                    outputTypeLabel,
                    nsSeparator: '^^',
                })}
            </span>
        </WithTooltip>
    )
}
