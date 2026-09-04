import type { FC, ReactNode } from 'react'

declare module '@dhis2/app-adapter' {
    type AppAdapterProps = {
        appName: string
        appUrlSlug: string
        appVersion: string
        apiVersion?: number
        children?: ReactNode
        direction?: 'ltr' | 'rtl' | 'auto'
        loginApp?: boolean
        plugin?: boolean
        pwaEnabled?: boolean
        url?: string
    }

    const AppAdapter: FC<AppAdapterProps>

    // eslint-disable-next-line import/no-default-export
    export default AppAdapter
}
