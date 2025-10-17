import { CssVariables } from '@dhis2/ui'
import cx from 'classnames'
import { useCallback, type FC } from 'react'
import classes from './app.module.css'
import { useLoadVisualizationOnMount } from './use-load-visualization-on-mount'
import { AppWrapper } from '@components/app-wrapper'
import type { MetadataInput } from '@components/app-wrapper/metadata-helpers'
import {
    GridCenterColumnBottom,
    GridCenterColumnTop,
    GridContainer,
    GridEndColumn,
    GridStartColumn,
    GridTopRow,
} from '@components/grid'
import { LineListLayout } from '@components/layout-panel/line-list-layout'
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { StartScreen } from '@components/start-screen/start-screen'
import { TitleBar } from '@components/title-bar/title-bar'
import { Toolbar } from '@components/toolbar/toolbar'
import {
    useAddMetadata,
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
    const addMetadata = useAddMetadata()
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

    const onResponseReceived = useCallback(
        (analyticsMetadata: MetadataInput) => {
            addMetadata(analyticsMetadata)
        },
        [addMetadata]
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
                <LineListLayout />
                <TitleBar />
            </GridCenterColumnTop>
            <GridCenterColumnBottom>
                {isVisualizationEmpty(currentVis) && !isVisualizationLoading ? (
                    <StartScreen />
                ) : (
                    <PluginWrapper
                        isVisualizationLoading={isVisualizationLoading}
                        visualization={currentVis}
                        displayProperty={currentUser.settings.displayProperty}
                        onDataSorted={onDataSorted}
                        onResponseReceived={onResponseReceived}
                    />
                )}
            </GridCenterColumnBottom>
            <GridEndColumn>
                <div
                    className={cx(classes.rightSidebar, {
                        [classes.hidden]: !isDetailsPanelVisible,
                    })}
                >
                    Interpretations panel
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
