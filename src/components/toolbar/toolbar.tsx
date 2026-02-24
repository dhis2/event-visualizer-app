import type { FC } from 'react'
import { ActionsBar } from './actions-bar/actions-bar'
import { ExpandedVisualizationCanvasToggler } from './expanded-visualization-canvas-toggler'
import { InterpretationsAndDetailsToggler } from './interpretations-and-details-toggler'
import classes from './styles/toolbar.module.css'
import { TitleBar } from './title-bar/title-bar'
import { ToolbarDivider } from './toolbar-divider'

export const Toolbar: FC = () => (
    <div className={classes.toolbar}>
        <ActionsBar />
        <ToolbarDivider />
        <TitleBar />
        <div className={classes.togglers}>
            <ExpandedVisualizationCanvasToggler />
            <InterpretationsAndDetailsToggler />
        </div>
    </div>
)
