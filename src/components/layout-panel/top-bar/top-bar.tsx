import { type FC } from 'react'
import { ExpandedLayoutPanelToggler } from './expanded-layout-panel-toggler'
import { OptionsButton } from './options-button'
import classes from './styles/top-bar.module.css'
import { VisualizationTypeSelector } from './visualization-type-selector/visualization-type-selector'

export const TopBar: FC = () => {
    return (
        <div className={classes.topBar}>
            <VisualizationTypeSelector />
            <OptionsButton />
            <div className={classes.topBarSpacer} />
            <ExpandedLayoutPanelToggler />
        </div>
    )
}
