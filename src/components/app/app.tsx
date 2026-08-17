import { AppWrapper } from '@components/app-wrapper'
import { Canvas } from '@components/canvas/canvas'
import { DetailsPanel } from '@components/details-panel/details-panel'
import { DimensionModal } from '@components/dimension-modal/dimension-modal'
import {
    GridCenterColumnBottom,
    GridCenterColumnTop,
    GridContainer,
    GridEndColumn,
    GridStartColumn,
    GridTopRow,
} from '@components/grid'
import { InterpretationModal } from '@components/interpretation-modal/interpretation-modal'
import { LayoutPanel } from '@components/layout-panel/layout-panel'
import { Sidebar } from '@components/sidebar/sidebar'
import { Toolbar } from '@components/toolbar/toolbar'
import { CssVariables } from '@dhis2/ui'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    getUiActiveDimensionModal,
    setUiActiveDimensionModal,
} from '@store/ui-slice'
import { useCallback, type FC } from 'react'
import { useLoadVisualizationOnMount } from './use-load-visualization-on-mount'
import './styles/app.module.css'

const EventVisualizer: FC = () => {
    useLoadVisualizationOnMount()
    const dispatch = useAppDispatch()
    const activeDimensionModal = useAppSelector(getUiActiveDimensionModal)

    const onDimensionModalClose = useCallback(
        () => dispatch(setUiActiveDimensionModal(null)),
        [dispatch]
    )

    return (
        <GridContainer>
            <GridTopRow>
                <Toolbar />
            </GridTopRow>
            <GridStartColumn>
                <Sidebar />
                {activeDimensionModal && (
                    <DimensionModal onClose={onDimensionModalClose} />
                )}
            </GridStartColumn>
            <GridCenterColumnTop>
                <LayoutPanel />
            </GridCenterColumnTop>
            <GridCenterColumnBottom>
                <Canvas />
            </GridCenterColumnBottom>
            <GridEndColumn>
                <DetailsPanel />
            </GridEndColumn>
            <InterpretationModal />
            <CssVariables colors spacers theme elevations />
        </GridContainer>
    )
}

export const App: FC = () => (
    <AppWrapper>
        <EventVisualizer />
    </AppWrapper>
)
