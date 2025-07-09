import { CachedDataQueryProvider, useCachedDataQuery } from '@dhis2/analytics'
import { Query } from '@dhis2/app-service-data'
import { freeze } from '@reduxjs/toolkit'
import type {
    MeDto,
    OrganisationUnit,
    OrganisationUnitLevel,
    SystemSettings,
} from '@types'
import React, { FC, ReactNode } from 'react'
import { PickWithFieldFilters } from '../types/pick-with-field-filters'

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
type CurrentUserData = PickWithFieldFilters<MeDto, typeof currentUserFields>
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
type TransformedCurrentUserSettings = {
    dbLocale: string
    uiLocale: string
    displayProperty: string
    displayNameProperty: 'displayName' | 'displayShortName'
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
}: AppCachedData): TransformedAppCachedData =>
    // This is read only data, so we freeze it
    freeze({
        currentUser: {
            ...currentUser,
            settings: {
                dbLocale: currentUser.settings?.keyDbLocale ?? 'en',
                uiLocale: currentUser.settings?.keyUiLocale ?? 'en',
                displayProperty:
                    currentUser.settings?.keyAnalysisDisplayProperty,
                displayNameProperty:
                    currentUser.settings?.keyAnalysisDisplayProperty === 'name'
                        ? 'displayName'
                        : 'displayShortName',
            },
        },
        // filter only the relevant settings to avoid storing all in Redux
        systemSettings: systemSettingsKeys.reduce((obj, key) => {
            obj[key] = systemSettings[key]
            return obj
        }, {}) as TransformedAppCachedData['systemSettings'],
        rootOrgUnits: rootOrgUnits.organisationUnits,
        orgUnitLevels: orgUnitLevels.organisationUnitLevels,
    })

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
