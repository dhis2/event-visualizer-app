import { AppWrapper } from '@components/app-wrapper'
import { DetailsPanel } from '@components/details-panel/details-panel'
import { useDimensionDialogAnchor } from '@components/dimension-dialog/anchor-context'
import { DimensionDialog } from '@components/dimension-dialog/dimension-dialog'
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
import type { LineListAnalyticsDataHeader } from '@components/line-list/types'
import { MainSidebar } from '@components/main-sidebar/main-sidebar'
import type { AnalyticsResponseMetadataItems } from '@components/plugin-wrapper/hooks/use-line-list-analytics-data'
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { StartScreen } from '@components/start-screen/start-screen'
import { Toolbar } from '@components/toolbar/toolbar'
import { CssVariables } from '@dhis2/ui'
import {
    useAddAnalyticsResponseMetadata,
    useAppDispatch,
    useAppSelector,
    useCurrentUser,
} from '@hooks'
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
    const addAnalyticsResponseMetadata = useAddAnalyticsResponseMetadata()
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

    const onResponsesReceived = useCallback(
        (
            analyticsMetadata: AnalyticsResponseMetadataItems,
            headers: Array<LineListAnalyticsDataHeader>
        ) => {
            addAnalyticsResponseMetadata(analyticsMetadata, headers)
        },
        [addAnalyticsResponseMetadata]
    )

    const { setAnchorEl } = useDimensionDialogAnchor()
    const onDimensionModalClose = useCallback(() => {
        dispatch(setUiActiveDimensionModal(null))
        setAnchorEl(null)
    }, [dispatch, setAnchorEl])

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
                        onResponsesReceived={onResponsesReceived}
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
                    <MainSidebar />
                </ErrorBoundary>
                {activeDimensionModal && (
                    <DimensionDialog onClose={onDimensionModalClose} />
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
