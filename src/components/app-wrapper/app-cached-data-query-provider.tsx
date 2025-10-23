import type { Query } from '@dhis2/app-service-data'
import { freeze } from '@reduxjs/toolkit'
import type { FC, ReactNode } from 'react'
import { CachedDataQueryProvider, useCachedDataQuery } from '@dhis2/analytics'
import type {
    MeDto,
    OrganisationUnit,
    OrganisationUnitLevel,
    PickWithFieldFilters,
    SystemSettings,
} from '@types'

const currentUserFields = [
    'id',
    'username',
    'displayName~rename(name)',
    'settings',
    'authorities',
] as const
const systemSettingsKeys = [
    'keyDateFormat',
    'keyAnalysisRelativePeriod',
    'keyAnalysisDigitGroupSeparator',
    'keyHideDailyPeriods',
    'keyHideWeeklyPeriods',
    'keyHideBiWeeklyPeriods',
    'keyHideMonthlyPeriods',
    'keyHideBiMonthlyPeriods',
    'keyIgnoreAnalyticsApprovalYearThreshold',
] as const
const rootOrgUnitsFields = ['id', 'displayName', 'name'] as const
const orgUnitLevelsFields = ['id', 'level', 'displayName', 'name'] as const
const query: Query = {
    currentUser: {
        resource: 'me',
        params: {
            fields: currentUserFields.join(','),
        },
    },
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
type CurrentUserData = Omit<
    PickWithFieldFilters<MeDto, typeof currentUserFields>,
    'settings'
> & { settings?: Record<string, string | undefined> }
type RootOrgUnitsData = Array<
    PickWithFieldFilters<OrganisationUnit, typeof rootOrgUnitsFields>
>
type OrgUnitLevelsData = Array<
    PickWithFieldFilters<OrganisationUnitLevel, typeof orgUnitLevelsFields>
>

type AppCachedData = {
    currentUser: CurrentUserData
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
    keyAnalysisDisplayProperty: string | undefined
}
export type TransformedAppCachedData = {
    currentUser: CurrentUserData & { settings: TransformedCurrentUserSettings }
    systemSettings: PickWithFieldFilters<
        SystemSettings,
        typeof systemSettingsKeys
    >
    rootOrgUnits: RootOrgUnitsData
    orgUnitLevels: OrgUnitLevelsData
}

const providerDataTransformation = ({
    currentUser,
    systemSettings,
    rootOrgUnits,
    orgUnitLevels,
}: AppCachedData): TransformedAppCachedData => {
    const displayNameProperty =
        currentUser.settings?.keyAnalysisDisplayProperty === 'name'
            ? 'displayName'
            : ('displayShortName' as 'displayName' | 'displayShortName')
    const transformedCurrentUser = {
        ...currentUser,
        settings: {
            dbLocale: currentUser.settings?.keyDbLocale ?? 'en',
            uiLocale: currentUser.settings?.keyUiLocale ?? 'en',
            displayProperty: currentUser.settings?.keyAnalysisDisplayProperty,
            displayNameProperty,
            // preserve this original key used in the InterpretationModal component in analytics
            keyAnalysisDisplayProperty:
                currentUser.settings?.keyAnalysisDisplayProperty,
        },
    }
    // filter only the relevant settings to avoid storing all in Redux
    const transformedSystemSettings = systemSettingsKeys.reduce((obj, key) => {
        obj[key] = systemSettings[key]
        return obj
    }, {}) as TransformedAppCachedData['systemSettings']
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

export const AppCachedDataQueryProvider: FC<{ children: ReactNode }> = ({
    children,
}) => (
    <CachedDataQueryProvider
        query={query}
        dataTransformation={providerDataTransformation}
    >
        {children}
    </CachedDataQueryProvider>
)

export const useAppCachedDataQuery = (): TransformedAppCachedData =>
    useCachedDataQuery<TransformedAppCachedData>()
export const useCurrentUser = (): TransformedAppCachedData['currentUser'] => {
    const { currentUser } = useAppCachedDataQuery()
    return currentUser
}
export const useSystemSettings =
    (): TransformedAppCachedData['systemSettings'] => {
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
