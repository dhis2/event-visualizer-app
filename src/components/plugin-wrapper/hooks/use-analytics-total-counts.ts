import { useConfig } from '@dhis2/app-runtime'
import type { SystemInfo } from '@types'

/* Counting line list rows is only fast enough on servers with a dedicated
 * analytics database, which report that through this capability. */
export const useAnalyticsTotalCounts = (): boolean => {
    const systemInfo = useConfig().systemInfo as Partial<SystemInfo> | undefined
    return systemInfo?.capability?.analyticsTotalCounts === true
}
