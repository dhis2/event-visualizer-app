import type { FC } from 'react'
import { ExpandedVisualizationCanvasToggler } from './expanded-visualization-canvas-toggler'
import { InterpretationsAndDetailsToggler } from './interpretations-and-details-toggler'
import { MenuBar } from './menu-bar/menu-bar'
import { NewButton } from './new-button'
import { OpenButton } from './open-button'
import { SaveButton } from './save-button'
import { ToolbarDivider } from './toolbar-divider'
import { TitleBar } from '@components/title-bar/title-bar'
import { Toolbar as AnalyticsToolbar } from '@dhis2/analytics'

export const Toolbar: FC = () => (
    <AnalyticsToolbar>
        <NewButton />
        <OpenButton />
        <SaveButton />
        <ToolbarDivider />
        <MenuBar />
        <ToolbarDivider />
        <TitleBar />
        <ExpandedVisualizationCanvasToggler />
        <InterpretationsAndDetailsToggler />
    </AnalyticsToolbar>
)
