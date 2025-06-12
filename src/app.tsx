import { useDataQuery } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import React, { FC } from 'react'
import { useRtkQuery } from './api'
import { AppWrapper } from './app-wrapper/app-wrapper'
import classes from './app.module.css'
import Hello from './hello'
import type { MeDto } from './types/dhis2-openapi-schemas'

interface QueryResults {
    me: MeDto
}

const query = {
    me: {
        resource: 'me',
    },
}

const EventVisualizer: FC = () => {
    const dhis2Query = useDataQuery<QueryResults>(query)
    const rtkqQuery = useRtkQuery(query)
    const rtkqQuerySimple = useRtkQuery(query.me)
    console.log(rtkqQuery)

    if (dhis2Query.error) {
        return <span>{i18n.t('ERROR')}</span>
    }

    if (dhis2Query.loading) {
        return <span>{i18n.t('Loading...')}</span>
    }

    console.log('DHIS2 Data:', dhis2Query.data)
    console.log('RTKQ Data (nested):', rtkqQuery.data)
    console.log('RTKQ Data (simple):', rtkqQuerySimple.data)

    return (
        <div className={classes.container}>
            <Hello name={dhis2Query.data.me.name} />
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
