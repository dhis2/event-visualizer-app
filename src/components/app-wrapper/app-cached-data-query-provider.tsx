import { CachedDataQueryProvider, useCachedDataQuery } from '@dhis2/analytics'
import { useCurrentUserInfo } from '@dhis2/app-runtime'
import type { Query } from '@dhis2/app-service-data'
import { freeze } from '@reduxjs/toolkit'
import type {
    OrganisationUnit,
    OrganisationUnitLevel,
    PickWithFieldFilters,
    SystemSettings,
} from '@types'
import type { FC, ReactNode } from 'react'

const rootOrgUnitsFields = ['id', 'displayName', 'name', 'path'] as const
const orgUnitLevelsFields = ['id', 'level', 'displayName', 'name'] as const
const query: Query = {
    systemSettings: {
        resource: 'systemSettings',
    },
    rootOrgUnits: {
        resource: 'organisationUnits',
        params: {
            fields: rootOrgUnitsFields.join(','),
            userDataViewFallback: true,
            paging: false,
        },
    },
    orgUnitLevels: {
        resource: 'organisationUnitLevels',
        params: {
            fields: orgUnitLevelsFields.join(','),
            paging: false,
        },
    },
}
type CurrentUserInfo = NonNullable<ReturnType<typeof useCurrentUserInfo>>
type CurrentUserData = Pick<
    CurrentUserInfo,
    'id' | 'username' | 'authorities'
> & {
    name: string
    settings?: Record<string, string | undefined>
}
type RootOrgUnitsData = Array<
    PickWithFieldFilters<Required<OrganisationUnit>, typeof rootOrgUnitsFields>
>
type OrgUnitLevelsData = Array<
    PickWithFieldFilters<
        Required<OrganisationUnitLevel>,
        typeof orgUnitLevelsFields
    >
>

type AppCachedQueryData = {
    systemSettings: SystemSettings
    rootOrgUnits: {
        organisationUnits: RootOrgUnitsData
    }
    orgUnitLevels: { organisationUnitLevels: OrgUnitLevelsData }
}
type DisplayNameProperty = 'displayName' | 'displayShortName'
type TransformedCurrentUserSettings = {
    dbLocale: string
    uiLocale: string
    displayProperty: string | undefined
    displayNameProperty: DisplayNameProperty
}
type TransformedSystemSettings = {
    dateFormat: SystemSettings['keyDateFormat']
    relativePeriod: SystemSettings['keyAnalysisRelativePeriod']
    digitGroupSeparator: SystemSettings['keyAnalysisDigitGroupSeparator']
    hideDailyPeriods: SystemSettings['keyHideDailyPeriods']
    hideWeeklyPeriods: SystemSettings['keyHideWeeklyPeriods']
    hideBiWeeklyPeriods: SystemSettings['keyHideBiWeeklyPeriods']
    hideMonthlyPeriods: SystemSettings['keyHideMonthlyPeriods']
    hideBiMonthlyPeriods: SystemSettings['keyHideBiMonthlyPeriods']
    ignoreApprovalYearThreshold: SystemSettings['keyIgnoreAnalyticsApprovalYearThreshold']
}
export type TransformedAppCachedData = {
    currentUser: CurrentUserData & { settings: TransformedCurrentUserSettings }
    systemSettings: TransformedSystemSettings
    rootOrgUnits: RootOrgUnitsData
    orgUnitLevels: OrgUnitLevelsData
}

const toCurrentUserData = ({
    id,
    username,
    displayName,
    authorities,
    settings,
}: CurrentUserInfo): CurrentUserData => ({
    id,
    username,
    name: displayName,
    authorities,
    settings,
})

const providerDataTransformation = (
    { systemSettings, rootOrgUnits, orgUnitLevels }: AppCachedQueryData,
    currentUser: CurrentUserData
): TransformedAppCachedData => {
    const displayNameProperty: DisplayNameProperty =
        currentUser.settings?.keyAnalysisDisplayProperty === 'name'
            ? 'displayName'
            : 'displayShortName'
    const transformedCurrentUser = {
        ...currentUser,
        settings: {
            dbLocale: currentUser.settings?.keyDbLocale ?? 'en',
            uiLocale: currentUser.settings?.keyUiLocale ?? 'en',
            displayProperty: currentUser.settings?.keyAnalysisDisplayProperty,
            displayNameProperty,
        },
    }
    const transformedSystemSettings: TransformedSystemSettings = {
        dateFormat: systemSettings.keyDateFormat,
        relativePeriod: systemSettings.keyAnalysisRelativePeriod,
        digitGroupSeparator: systemSettings.keyAnalysisDigitGroupSeparator,
        hideDailyPeriods: systemSettings.keyHideDailyPeriods,
        hideWeeklyPeriods: systemSettings.keyHideWeeklyPeriods,
        hideBiWeeklyPeriods: systemSettings.keyHideBiWeeklyPeriods,
        hideMonthlyPeriods: systemSettings.keyHideMonthlyPeriods,
        hideBiMonthlyPeriods: systemSettings.keyHideBiMonthlyPeriods,
        ignoreApprovalYearThreshold:
            systemSettings.keyIgnoreAnalyticsApprovalYearThreshold,
    }
    const transformedRootOrgUnits = rootOrgUnits.organisationUnits
    const transformedOrgUnitLevels = orgUnitLevels.organisationUnitLevels

    // This is read only data, so we freeze it
    return freeze({
        currentUser: transformedCurrentUser,
        systemSettings: transformedSystemSettings,
        rootOrgUnits: transformedRootOrgUnits,
        orgUnitLevels: transformedOrgUnitLevels,
    })
}

/* The app-shell fetches `/api/me` before rendering the app and exposes it
 * through `useCurrentUserInfo`, so the current user is not part of the query. */
export const AppCachedDataQueryProvider: FC<{ children: ReactNode }> = ({
    children,
}) => {
    const currentUserInfo = useCurrentUserInfo()

    if (!currentUserInfo) {
        throw new Error('Current user info is not available')
    }

    const currentUser = toCurrentUserData(currentUserInfo)

    return (
        <CachedDataQueryProvider<AppCachedQueryData, TransformedAppCachedData>
            query={query}
            dataTransformation={(queryData) =>
                providerDataTransformation(queryData, currentUser)
            }
        >
            {children}
        </CachedDataQueryProvider>
    )
}

export const useAppCachedDataQuery = (): TransformedAppCachedData =>
    useCachedDataQuery<TransformedAppCachedData>()
export const useCurrentUser = (): TransformedAppCachedData['currentUser'] => {
    const { currentUser } = useAppCachedDataQuery()
    return currentUser
}
export const useSystemSettings = (): TransformedSystemSettings => {
    const { systemSettings } = useAppCachedDataQuery()
    return systemSettings
}
export const useRootOrgUnits = (): TransformedAppCachedData['rootOrgUnits'] => {
    const { rootOrgUnits } = useAppCachedDataQuery()
    return rootOrgUnits
}
export const useOrgUnitLevels =
    (): TransformedAppCachedData['orgUnitLevels'] => {
        const { orgUnitLevels } = useAppCachedDataQuery()
        return orgUnitLevels
    }
