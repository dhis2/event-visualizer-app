import i18n from '@dhis2/d2-i18n'
import { CssVariables } from '@dhis2/ui'
import cx from 'classnames'
import type { FC } from 'react'
import classes from './app.module.css'
import { AppWrapper } from '@components/app-wrapper'
import { useMetadataItem } from '@components/app-wrapper/metadata-provider'
import {
    GridCenterColumnBottom,
    GridCenterColumnTop,
    GridContainer,
    GridEndColumn,
    GridStartColumn,
    GridTopRow,
} from '@components/grid'
import { Toolbar } from '@components/toolbar/toolbar'
import { LineListingLayout } from '@components/visualization-layout/line-listing-layout'
import { useAppSelector, useCurrentUser, useSystemSettings } from '@hooks'
import {
    getUiDetailsPanelVisible,
    getUiMainSidebarVisible,
} from '@store/ui-slice'

const EventVisualizer: FC = () => {
    const currentUser = useCurrentUser()
    const systemSettings = useSystemSettings()
    const today = useMetadataItem('TODAY')

    const isMainSidebarVisible = useAppSelector(getUiMainSidebarVisible)
    const isDetailsPanelVisible = useAppSelector(getUiDetailsPanelVisible)

    console.log('systemSettings', today, systemSettings)

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
                    <LineListingLayout />
                    <h1>Visualization Canvas</h1>
                    <h2>
                        {i18n.t('Hello {{name}}', { name: currentUser.name })}
                    </h2>
                    <h3>{i18n.t('Welcome to DHIS2 with TypeScript!')}</h3>
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
