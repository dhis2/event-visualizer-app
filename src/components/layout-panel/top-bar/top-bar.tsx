import cx from 'classnames'
import { type FC } from 'react'
import { ExpandedLayoutPanelToggler } from './expanded-layout-panel-toggler'
import { OptionsButton } from './options-button'
import classes from './styles/top-bar.module.css'
import { VisualizationTypeSelector } from './visualization-type-selector/visualization-type-selector'
import { useAppSelector } from '@hooks'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'

export const TopBar: FC = () => {
    const dataSourceId = useAppSelector(getDataSourceId)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)

    return (
        <div className={classes.topBar}>
            <div
                className={cx(classes.container, {
                    [classes.loading]: isVisualizationLoading,
                })}
            >
                <VisualizationTypeSelector />
                <OptionsButton />
                <div className={classes.containerSpacer} />
                {dataSourceId && <ExpandedLayoutPanelToggler />}
            </div>
        </div>
    )
}
