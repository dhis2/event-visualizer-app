import { CssVariables } from '@dhis2/ui'
import cx from 'classnames'
import { useCallback, type FC } from 'react'
import classes from './app.module.css'
import { useLoadVisualizationOnMount } from './use-load-visualization-on-mount'
import { AppWrapper } from '@components/app-wrapper'
import { DetailsPanel } from '@components/details-panel/details-panel'
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
import type {
    AnalyticsResponseMetadataDimensions,
    AnalyticsResponseMetadataItems,
} from '@components/plugin-wrapper/hooks/use-line-list-analytics-data'
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { StartScreen } from '@components/start-screen/start-screen'
import { TitleBar } from '@components/title-bar/title-bar'
import { Toolbar } from '@components/toolbar/toolbar'
import {
    useAddAnalyticsResponseMetadata,
    useAppDispatch,
    useAppSelector,
    useCurrentUser,
} from '@hooks'
import { isVisualizationEmpty } from '@modules/visualization'
import { getCurrentVis, setCurrentVis } from '@store/current-vis-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'
import {
    getUiDetailsPanelVisible,
    getUiMainSidebarVisible,
} from '@store/ui-slice'
import type { CurrentVisualization, Sorting } from '@types'

const EventVisualizer: FC = () => {
    useLoadVisualizationOnMount()
    const addAnalyticsResponseMetadata = useAddAnalyticsResponseMetadata()
    const dispatch = useAppDispatch()
    const currentUser = useCurrentUser()
    const currentVis = useAppSelector(getCurrentVis)
    const isMainSidebarVisible = useAppSelector(getUiMainSidebarVisible)
    const isDetailsPanelVisible = useAppSelector(getUiDetailsPanelVisible)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)

    const onDataSorted = useCallback(
        (sorting: Sorting) => {
            dispatch(
                setCurrentVis({
                    ...currentVis,
                    sorting: sorting ? [sorting] : undefined,
                } as CurrentVisualization)
            )
        },
        [currentVis, dispatch]
    )

    const onResponsesReceived = useCallback(
        (
            analyticsMetadata: AnalyticsResponseMetadataItems,
            dimensions: AnalyticsResponseMetadataDimensions,
            headers: Array<LineListAnalyticsDataHeader>
        ) => {
            addAnalyticsResponseMetadata(analyticsMetadata, dimensions, headers)
        },
        [addAnalyticsResponseMetadata]
    )

    return (
        <GridContainer>
            <GridTopRow>
                <Toolbar />
            </GridTopRow>
            <GridStartColumn>
                <div
                    className={cx(classes.mainSidebar, {
                        [classes.hidden]: !isMainSidebarVisible,
                    })}
                >
                    Main sidebar
                </div>
            </GridStartColumn>
            <GridCenterColumnTop>
                <LayoutPanel />
                <TitleBar />
            </GridCenterColumnTop>
            <GridCenterColumnBottom>
                {isVisualizationEmpty(currentVis) && !isVisualizationLoading ? (
                    <StartScreen />
                ) : (
                    <>
                        <PluginWrapper
                            isVisualizationLoading={isVisualizationLoading}
                            visualization={currentVis}
                            displayProperty={
                                currentUser.settings.displayProperty
                            }
                            onDataSorted={onDataSorted}
                            onResponsesReceived={onResponsesReceived}
                        />
                        <InterpretationModal />
                    </>
                )}
            </GridCenterColumnBottom>
            <GridEndColumn>
                <div
                    className={cx(classes.rightSidebar, {
                        [classes.hidden]: !isDetailsPanelVisible,
                    })}
                >
                    {isDetailsPanelVisible && <DetailsPanel />}
                </div>
            </GridEndColumn>
            <CssVariables colors spacers theme />
        </GridContainer>
    )
}

export const App: FC = () => (
    <AppWrapper>
        <EventVisualizer />
    </AppWrapper>
)
