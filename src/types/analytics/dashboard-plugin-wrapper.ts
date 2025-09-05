import type { FC, ReactNode } from 'react'

type RenderProp<P> = (props: P) => ReactNode

type DashboardPluginWrapperProps<P> = {
    cacheId: string
    children: RenderProp<P>
    isParentCached?: boolean
    onInstallationStatusChange?: () => void
}

export type DashboardPluginWrapper<P> = FC<DashboardPluginWrapperProps<P>>
