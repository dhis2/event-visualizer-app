import i18n from '@dhis2/d2-i18n'
import type { MeDto } from '@types'
import React, { FC } from 'react'
import { AppWrapper } from './app-wrapper'
import { useSystemSettings } from './app-wrapper/app-cached-data-query-provider'
import classes from './app.module.css'
import { UserProfileExample } from './components/examples/user-profile-example'
import Hello from './hello'
import { useRtkQuery } from './hooks'

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

    console.log('RTKQ Data):', rtkqQuery.data)
    console.log('systemSettings', systemSettings)

    return (
        <div className={classes.container}>
            <Hello name={me.name} />
            <h3>{i18n.t('Welcome to DHIS2 with TypeScript!')}</h3>
            <h4>Example Component:</h4>
            <UserProfileExample />
        </div>
    )
}

const App: FC = () => (
    <AppWrapper>
        <EventVisualizer />
    </AppWrapper>
)

export default App
