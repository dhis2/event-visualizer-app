import { IconTableRows } from '@components/layout-panel/bottom-bar/icon-table-rows'
import i18n from '@dhis2/d2-i18n'
import { useAppSelector, useOutputTypeLabel } from '@hooks'
import { getVisUiConfigOutputType } from '@store/vis-ui-config-slice'
import { type FC } from 'react'
import classes from './styles/row-granularity-label.module.css'

export const RowGranularityLabel: FC = () => {
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const outputTypeLabel = useOutputTypeLabel(outputType)

    return (
        <span className={classes.label} data-test="row-granularity-label">
            <IconTableRows />
            {i18n.t('One row for each {{- outputTypeLabel}}', {
                outputTypeLabel,
                nsSeparator: '^^',
            })}
        </span>
    )
}
