import i18n from '@dhis2/d2-i18n'
import { CssVariables } from '@dhis2/ui'
import type { MeDto } from '@types'
import cx from 'classnames'
import React, { FC, useState } from 'react'
import { AppWrapper } from './app-wrapper'
import classes from './app.module.css'
import { Examples } from './components/examples'
import { Toolbar } from './components/toolbar/toolbar'
import { Hello } from './hello'
import { useRtkQuery, useSystemSettings } from './hooks'

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
                <Hello name={me.name} />
                <h3>{i18n.t('Welcome to DHIS2 with TypeScript!')}</h3>
                <button onClick={() => setShowExamples((v) => !v)}>
                    {showExamples ? 'Hide' : 'Show'} Examples
                </button>
                {showExamples && <Examples />}
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
