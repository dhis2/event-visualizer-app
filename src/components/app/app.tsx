import { AppWrapper } from '@components/app-wrapper'
import { DetailsPanel } from '@components/details-panel/details-panel'
import { DimensionModal } from '@components/dimension-modal/dimension-modal'
import { ErrorBoundary } from '@components/error-boundary/error-boundary'
import { ErrorScreen } from '@components/error-screen/error-screen'
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
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { Sidebar } from '@components/sidebar/sidebar'
import { StartScreen } from '@components/start-screen/start-screen'
import { Toolbar } from '@components/toolbar/toolbar'
import { CssVariables } from '@dhis2/ui'
import { useAppDispatch, useAppSelector, useCurrentUser } from '@hooks'
import { isVisualizationEmpty } from '@modules/visualization'
import { getCurrentVis, setCurrentVis } from '@store/current-vis-slice'
import {
    getIsVisualizationLoading,
    getLoadError,
    setLoadError,
} from '@store/loader-slice'
import {
    getUiActiveDimensionModal,
    setUiActiveDimensionModal,
} from '@store/ui-slice'
import type { Sorting } from '@types'
import { useCallback, type FC, type ReactNode } from 'react'
import { useLoadVisualizationOnMount } from './use-load-visualization-on-mount'
import './styles/app.module.css'

const EventVisualizer: FC = () => {
    useLoadVisualizationOnMount()
    const dispatch = useAppDispatch()
    const currentUser = useCurrentUser()
    const currentVis = useAppSelector(getCurrentVis)
    const activeDimensionModal = useAppSelector(getUiActiveDimensionModal)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const loadError = useAppSelector(getLoadError)

    const onError = useCallback(
        (error: Error) => dispatch(setLoadError(error)),
        [dispatch]
    )

    const onDataSorted = useCallback(
        (sorting: Sorting) => {
            if (isVisualizationEmpty(currentVis)) {
                throw new Error(
                    'onDataSorted called with an empty visualization'
                )
            }
            dispatch(
                setCurrentVis({
                    ...currentVis,
                    sorting: sorting ? [sorting] : undefined,
                })
            )
        },
        [currentVis, dispatch]
    )

    const onDimensionModalClose = useCallback(
        () => dispatch(setUiActiveDimensionModal(null)),
        [dispatch]
    )

    let centerContent: ReactNode
    if (loadError) {
        centerContent = <ErrorScreen error={loadError} />
    } else if (isVisualizationEmpty(currentVis) && !isVisualizationLoading) {
        centerContent = <StartScreen />
    } else {
        centerContent = (
            <>
                <ErrorBoundary onError={onError}>
                    <PluginWrapper
                        isVisualizationLoading={isVisualizationLoading}
                        visualization={currentVis}
                        displayProperty={currentUser.settings.displayProperty}
                        onDataSorted={onDataSorted}
                    />
                </ErrorBoundary>
                <InterpretationModal />
            </>
        )
    }

    return (
        <GridContainer>
            <GridTopRow>
                <Toolbar />
            </GridTopRow>
            <GridStartColumn>
                <ErrorBoundary onError={onError}>
                    <Sidebar />
                </ErrorBoundary>
                {activeDimensionModal && (
                    <DimensionModal onClose={onDimensionModalClose} />
                )}
            </GridStartColumn>
            <GridCenterColumnTop>
                <ErrorBoundary onError={onError}>
                    <LayoutPanel />
                </ErrorBoundary>
            </GridCenterColumnTop>
            <GridCenterColumnBottom>{centerContent}</GridCenterColumnBottom>
            <GridEndColumn>
                <DetailsPanel />
            </GridEndColumn>
            <CssVariables colors spacers theme elevations />
        </GridContainer>
    )
}

export const App: FC = () => (
    <AppWrapper>
        <EventVisualizer />
    </AppWrapper>
)
