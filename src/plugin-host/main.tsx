import AppAdapter from '@dhis2/app-adapter'
import { CssReset } from '@dhis2/ui'
import { createRoot } from 'react-dom/client'
import { PluginHostApp } from './plugin-host-app'

const container = document.getElementById('dhis2-app-root')

if (container) {
    createRoot(container).render(
        <>
            <CssReset />
            <AppAdapter
                appName={process.env.DHIS2_APP_NAME as string}
                appUrlSlug={process.env.DHIS2_APP_URL_SLUG as string}
                appVersion={process.env.DHIS2_APP_VERSION as string}
                url={process.env.DHIS2_BASE_URL as string}
            >
                <PluginHostApp />
            </AppAdapter>
        </>
    )
}
