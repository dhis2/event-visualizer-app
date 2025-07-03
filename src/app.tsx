import i18n from '@dhis2/d2-i18n'
import type { MeDto } from '@types'
import React, { FC } from 'react'
import { AppWrapper } from './app-wrapper'
import { useSystemSettings } from './app-wrapper/app-cached-data-query-provider'
import classes from './app.module.css'
import Hello from './hello'
import { useRtkQuery } from './hooks'

const query = {
    me: {
        resource: 'me',
    },
}

const EventVisualizer: FC = () => {
    const rtkqQuery = useRtkQuery(query)
    const rtkqQuerySimple = useRtkQuery(query.me)
    const systemSettings = useSystemSettings()

    console.log(rtkqQuery, systemSettings)

    if (rtkqQuery.error) {
        return <span>{i18n.t('ERROR')}</span>
    }

    if (rtkqQuery.isLoading) {
        return <span>{i18n.t('Loading...')}</span>
    }

    const me = rtkqQuerySimple.data as MeDto

    console.log('RTKQ Data (nested):', rtkqQuery.data)
    console.log('RTKQ Data (simple):', rtkqQuerySimple.data)

    return (
        <div className={classes.container}>
            <Hello name={me.name} />
            <h3>{i18n.t('Welcome to DHIS2 with TypeScript!')}</h3>
        </div>
    )
}

const App: FC = () => (
    <AppWrapper>
        <EventVisualizer />
    </AppWrapper>
)

export default App
