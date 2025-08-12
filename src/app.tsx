import i18n from '@dhis2/d2-i18n'
import { CssVariables } from '@dhis2/ui'
import cx from 'classnames'
import type { FC } from 'react'
import classes from './app.module.css'
import { AppWrapper } from './components/app-wrapper'
import { useRtkQuery, useSystemSettings } from './hooks'
import { Toolbar } from '@components/toolbar/toolbar'
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

    console.log('systemSettings', systemSettings)

    return (
        <div
            className={cx(classes.everApp, classes.flexCt, classes.flexDirCol)}
        >
            <Toolbar />

            <div
                className={cx(
                    classes.sectionMain,
                    classes.flexGrow1,
                    classes.flexCt
                )}
            >
                <h1>{i18n.t('Hello {{name}}', { name: me.name })}</h1>
                <h3>{i18n.t('Welcome to DHIS2 with TypeScript!')}</h3>
            </div>
            <CssVariables colors spacers theme />
        </div>
    )
}

const App: FC = () => (
    <AppWrapper>
        <EventVisualizer />
    </AppWrapper>
)

// eslint-disable-next-line import/no-default-export
export default App
