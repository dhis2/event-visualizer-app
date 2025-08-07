import type { FC } from 'react'
import { InterpretationsAndDetailsToggler } from './interpretations-and-details-toggler'
import { MenuBar } from './menu-bar/menu-bar'
import { UpdateButton } from './update-button'
import { VisualizationTypeSelector } from './visualization-type-selector/visualization-type-selector'
import { Toolbar as AnalyticsToolbar } from '@dhis2/analytics'

type ToolbarProps = {
    onFileMenuAction: () => void
}

export const Toolbar: FC<ToolbarProps> = ({ onFileMenuAction }) => (
    <AnalyticsToolbar>
        <VisualizationTypeSelector />
        <UpdateButton />
        <MenuBar onFileMenuAction={onFileMenuAction} />
        <InterpretationsAndDetailsToggler />
    </AnalyticsToolbar>
)
