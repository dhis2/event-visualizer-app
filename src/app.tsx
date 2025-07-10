import i18n from '@dhis2/d2-i18n'
import type { MeDto } from '@types'
import React, { FC, useState } from 'react'
import { AppWrapper } from './app-wrapper'
import { useSystemSettings } from './app-wrapper/app-cached-data-query-provider'
import classes from './app.module.css'
import { DashboardExample } from './components/examples/dashboard-example'
import { LazyUserProfileExample } from './components/examples/lazy-user-profile-example'
import { UserProfileExample } from './components/examples/user-profile-example'
import Hello from './hello'
import { useRtkQuery } from './hooks'

const EventVisualizer: FC = () => {
    const [showExamples, setShowExamples] = useState(false)
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
        <div className={classes.container}>
            <Hello name={me.name} />
            <h3>{i18n.t('Welcome to DHIS2 with TypeScript!')}</h3>
            <button onClick={() => setShowExamples((v) => !v)}>
                {showExamples ? 'Hide' : 'Show'} Examples
            </button>
            {showExamples && (
                <div>
                    <h4>User Profile Example:</h4>
                    <UserProfileExample />
                    <hr />
                    <h4>Lazy User Profile Example:</h4>
                    <LazyUserProfileExample />
                    <hr />
                    <h4>Dashboard Example:</h4>
                    <DashboardExample />
                </div>
            )}
        </div>
    )
}

const App: FC = () => (
    <AppWrapper>
        <EventVisualizer />
    </AppWrapper>
)

export default App
