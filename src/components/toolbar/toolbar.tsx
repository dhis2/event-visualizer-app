import type { FC } from 'react'
import { ActionsBar } from './actions-bar/actions-bar'
import { ExpandedVisualizationCanvasToggler } from './expanded-visualization-canvas-toggler'
import { InterpretationsAndDetailsToggler } from './interpretations-and-details-toggler'
import { TitleBar } from './title-bar/title-bar'
import { ToolbarDivider } from './toolbar-divider'
import { Toolbar as AnalyticsToolbar } from '@dhis2/analytics'

export const Toolbar: FC = () => (
    <AnalyticsToolbar>
        <ActionsBar />
        <ToolbarDivider />
        <TitleBar />
        <ExpandedVisualizationCanvasToggler />
        <InterpretationsAndDetailsToggler />
    </AnalyticsToolbar>
)
