import i18n from '@dhis2/d2-i18n'
import { CssVariables } from '@dhis2/ui'
import type { FC } from 'react'
import './app.module.css'
import { AppWrapper } from './components/app-wrapper'
import { useAppSelector } from './hooks'
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
import { getCurrentVis } from '@store/current-vis-slice'

const EventVisualizer: FC = () => {
    const currentVis = useAppSelector(getCurrentVis)

    return (
        <GridContainer>
            <GridTopRow>
                <Toolbar />
            </GridTopRow>
            <GridStartColumn>
                <div
                    style={{
                        width: 260,
                        height: '100%',
                        padding: 8,
                        boxSizing: 'border-box',
                        borderRight: '1px solid #d5dde5',
                    }}
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
                    {currentVis && <PluginWrapper visualization={currentVis} />}
                </div>
            </GridCenterColumnBottom>
            <GridEndColumn>
                <div
                    style={{
                        width: 260,
                        height: '100%',
                        padding: 8,
                        boxSizing: 'border-box',
                        borderLeft: '1px solid #d5dde5',
                    }}
                >
                    Interpretations panel
                </div>
            </GridEndColumn>
            <CssVariables colors spacers theme />
        </GridContainer>
    )
}

const App: FC = () => (
    <AppWrapper>
        <EventVisualizer />
    </AppWrapper>
)

// eslint-disable-next-line import/no-default-export
export default App
