import type { FC } from 'react'
import { ActionsBar } from './actions-bar/actions-bar'
import { ExpandedVisualizationCanvasToggler } from './expanded-visualization-canvas-toggler'
import { InterpretationsAndDetailsToggler } from './interpretations-and-details-toggler'
import styles from './styles/toolbar.module.css'
import { TitleBar } from './title-bar/title-bar'
import { ToolbarDivider } from './toolbar-divider'

export const Toolbar: FC = () => (
    <div className={styles.toolbar}>
        <ActionsBar />
        <ToolbarDivider />
        <TitleBar />
        <div className={styles.togglers}>
            <ExpandedVisualizationCanvasToggler />
            <InterpretationsAndDetailsToggler />
        </div>
    </div>
)
