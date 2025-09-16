import i18n from '@dhis2/d2-i18n'
import { CssVariables } from '@dhis2/ui'
import cx from 'classnames'
import type { FC } from 'react'
import classes from './app.module.css'
import { AppWrapper } from '@components/app-wrapper'
import {
    GridCenterColumnBottom,
    GridCenterColumnTop,
    GridContainer,
    GridEndColumn,
    GridStartColumn,
    GridTopRow,
} from '@components/grid'
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { Toolbar } from '@components/toolbar/toolbar'
import { useAppSelector, useCurrentUser } from '@hooks'
import { getCurrentVis } from '@store/current-vis-slice'
import {
    getUiDetailsPanelVisible,
    getUiMainSidebarVisible,
} from '@store/ui-slice'

const EventVisualizer: FC = () => {
    const currentUser = useCurrentUser()
    const currentVis = useAppSelector(getCurrentVis)
    const isMainSidebarVisible = useAppSelector(getUiMainSidebarVisible)
    const isDetailsPanelVisible = useAppSelector(getUiDetailsPanelVisible)

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
                <div style={{ padding: 8 }}>Titlebar</div>
            </GridCenterColumnTop>
            <GridCenterColumnBottom>
                <div style={{ padding: 8 }}>
                    <h1>Visualization Canvas</h1>
                    <h3>{i18n.t('Welcome to DHIS2 with TypeScript!')}</h3>
                    {/* TODO use a type guard and implement the landing screen DHIS2-20123 */}
                    {currentVis && (
                        <PluginWrapper
                            visualization={currentVis}
                            displayProperty={
                                currentUser.settings.displayProperty
                            }
                        />
                    )}
                </div>
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
