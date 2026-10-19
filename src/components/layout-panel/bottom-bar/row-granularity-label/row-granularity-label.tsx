import { IconTableRows } from '@components/layout-panel/bottom-bar/icon-table-rows'
import { getOutputTypeTooltipConfig } from '@components/layout-panel/bottom-bar/output-type-validity'
import { DEFAULT_TOOLTIP_OPEN_DELAY } from '@components/layout-panel/bottom-bar/tooltip-config'
import i18n from '@dhis2/d2-i18n'
import { Tooltip } from '@dhis2/ui'
import { useAppSelector, useMetadataStore, useOutputTypeLabel } from '@hooks'
import { getVisUiConfigOutputType } from '@store/vis-ui-config-slice'
import cx from 'classnames'
import { useMemo, type FC } from 'react'
import classes from './styles/row-granularity-label.module.css'

export const RowGranularityLabel: FC = () => {
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const outputTypeLabel = useOutputTypeLabel(outputType)
    const visUiConfig = useAppSelector((state) => state.visUiConfig)
    const metadataStore = useMetadataStore()

    /* The row granularity label uses the same logic as the action buttons, when they are disabled they show a tooltip. */
    const tooltipConfig = useMemo(
        () =>
            getOutputTypeTooltipConfig({
                outputType,
                visUiConfig,
                metadataStore,
            }),
        [outputType, visUiConfig, metadataStore]
    )
    const label = (
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
    )

    return tooltipConfig ? (
        <Tooltip
            content={tooltipConfig.content}
            openDelay={tooltipConfig.openDelay ?? DEFAULT_TOOLTIP_OPEN_DELAY}
        >
            {label}
        </Tooltip>
    ) : (
        label
    )
}
