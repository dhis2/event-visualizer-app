import i18n from '@dhis2/d2-i18n'
import { CssVariables } from '@dhis2/ui'
import type { FC } from 'react'
import './app.module.css'
import { AppWrapper } from './components/app-wrapper'
import { useRtkQuery, useSystemSettings } from './hooks'
import {
    GridCenterColumnBottom,
    GridCenterColumnTop,
    GridContainer,
    GridEndColumn,
    GridStartColumn,
    GridTopRow,
} from '@components/grid'
import { Toolbar } from '@components/toolbar/toolbar'
import { Axis } from '@components/visualization-layout/axis'
import { LineListingLayout } from '@components/visualization-layout/line-listing-layout'
import type { MeDto } from '@types'

const EventVisualizer: FC = () => {
    const rtkqQuery = useRtkQuery({
        resource: 'me',
    })
    const systemSettings = useSystemSettings()

    if (rtkqQuery.error) {
        return <span>{i18n.t('ERROR')}</span>
    }

    if (rtkqQuery.isLoading) {
        return <span>{i18n.t('Loading...')}</span>
    }

    const me = rtkqQuery.data as MeDto

    // console.log('systemSettings', systemSettings)
    console.log('jj rendering EventVisualizer, me:', me)

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
                    <LineListingLayout />
                    <h1>Visualization Canvas</h1>
                    <h2>{i18n.t('Hello {{name}}', { name: me.name })}</h2>
                    <h3>{i18n.t('Welcome to DHIS2 with TypeScript!')}</h3>
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
