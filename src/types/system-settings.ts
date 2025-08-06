// Generated type is lacking "key" prefixes on the property names
import type {
    AnalyticsCacheTtlMode,
    AnalyticsFinancialYearStartKey,
    Cacheability,
    CacheStrategy,
    DigitGroupSeparator,
    DisplayProperty,
    FileResourceRetentionStrategy,
    LoginPageLayout,
    NotificationLevel,
    RelativePeriodEnum,
} from './dhis2-openapi-schemas'

export type SystemSettings = {
    keyAcceptanceRequiredForApproval?: boolean
    keyAccountExpiresInDays: number
    keyAccountExpiryAlert?: boolean
    keyAccountRecoveryEnabled?: boolean
    keyAllowObjectAssignment?: boolean
    keyAnalysisDigitGroupSeparator: DigitGroupSeparator
    keyAnalysisDisplayProperty: DisplayProperty
    keyAnalysisRelativePeriod: RelativePeriodEnum
    keyAnalyticsCacheProgressiveTtlFactor: number
    keyAnalyticsCacheTtlMode: AnalyticsCacheTtlMode
    keyAnalyticsFinancialYearStart: AnalyticsFinancialYearStartKey
    keyAnalyticsMaxLimit: number
    keyAnalyticsPeriodYearsOffset: number
    keyApplicationFooter?: string
    keyApplicationIntro?: string
    keyApplicationNotification?: string
    keyApplicationRightFooter?: string
    keyApplicationTitle?: string
    keyAutoVerifyInvitedUserEmail?: boolean
    keyBingMapsApiKey?: string
    keyCacheStrategy: CacheStrategy
    keyCacheability: Cacheability
    keyCalendar?: string
    keyCanGrantOwnUserRoles?: boolean
    keyCountPassiveDashboardViewsInUsageAnalytics?: boolean
    keyCredentialsExpires: number
    keyCredentialsExpiresReminderInDays: number
    keyCredentialsExpiryAlert?: boolean
    keyCurrentDomainType?: string
    keyCustomCss?: string
    keyCustomJs?: string
    keyCustomLoginPageLogo?: boolean
    keyCustomTopMenuLogo?: boolean
    keyDashboardContextMenuItemOpenInRelevantApp?: boolean
    keyDashboardContextMenuItemShowInterpretationsAndDetails?: boolean
    keyDashboardContextMenuItemSwitchViewType?: boolean
    keyDashboardContextMenuItemViewFullscreen?: boolean
    keyDataImportRequireAttributeOptionCombo?: boolean
    keyDataImportRequireCategoryOptionCombo?: boolean
    keyDataImportStrictAttributeOptionCombos?: boolean
    keyDataImportStrictCategoryOptionCombos?: boolean
    keyDataImportStrictDataElements?: boolean
    keyDataImportStrictDataSetApproval?: boolean
    keyDataImportStrictDataSetInputPeriods?: boolean
    keyDataImportStrictDataSetLocking?: boolean
    keyDataImportStrictOrganisationUnits?: boolean
    keyDataImportStrictPeriods?: boolean
    keyDataQualityMaxLimit: number
    keyDatabaseServerCpus: number
    keyDateFormat?: string
    keyDbLocale?: string
    keyDefaultBaseMap?: string
    keyEmailConfigured?: boolean
    keyEmailHostName?: string
    keyEmailPassword?: string
    keyEmailPort: number
    keyEmailSender?: string
    keyEmailTls?: boolean
    keyEmailUsername?: string
    keyEmbeddedDashboardsEnabled?: boolean
    keyEnforceVerifiedEmail?: boolean
    keyFactorOfDeviation: number
    keyFileResourceRetentionStrategy: FileResourceRetentionStrategy
    keyFlag?: string
    keyFlagImage?: string
    keyGatherAnalyticalObjectStatisticsInDashboardViews?: boolean
    keyGlobalShellAppName?: string
    keyGlobalShellEnabled?: boolean
    keyGoogleAnalyticsUA?: string
    keyGoogleMapsApiKey?: string
    keyHelpPageLink?: string
    keyHideBiMonthlyPeriods?: boolean
    keyHideBiWeeklyPeriods?: boolean
    keyHideDailyPeriods?: boolean
    keyHideMonthlyPeriods?: boolean
    keyHideUnapprovedDataInAnalytics?: boolean
    keyHideWeeklyPeriods?: boolean
    keyHtmlPushAnalyticsUrl?: string
    keyIgnoreAnalyticsApprovalYearThreshold: number
    keyIncludeZeroValuesInAnalytics?: boolean
    keyJobsCleanupAfterMinutes: number
    keyJobsLogDebugBelowSeconds: number
    keyJobsMaxCronDelayHours: number
    keyJobsRescheduleAfterMinutes: number
    keyLastCompleteDataSetRegistrationSyncSuccess?: string
    keyLastMetaDataSyncSuccess?: string
    keyLastMonitoringRun?: string
    keyLastSuccessfulAnalyticsTablesRuntime?: string
    keyLastSuccessfulAnalyticsTablesUpdate?: string
    keyLastSuccessfulDataStatistics?: string
    keyLastSuccessfulDataSynch?: string
    keyLastSuccessfulEventsDataSynch?: string
    keyLastSuccessfulLatestAnalyticsPartitionRuntime?: string
    keyLastSuccessfulLatestAnalyticsPartitionUpdate?: string
    keyLastSuccessfulMonitoring?: string
    keyLastSuccessfulResourceTablesUpdate?: string
    keyLastSuccessfulScheduledDataSetNotifications?: string
    keyLastSuccessfulScheduledProgramNotifications?: string
    keyLastSuccessfulSystemMonitoringPush?: string
    keyLockMultipleFailedLogins?: boolean
    keyLoginPageLayout: LoginPageLayout
    keyLoginPageTemplate?: string
    keyLoginPopup?: string
    keyMaxPasswordLength: number
    keyMetaDataRepoUrl?: string
    keyMetadataFailedVersion?: string
    keyMetadataLastFailedTime?: string
    keyMinPasswordLength: number
    keyNextAnalyticsTableUpdate?: string
    keyNotifierCleanAfterIdleTime: number
    keyNotifierGistOverview?: boolean
    keyNotifierLogLevel: NotificationLevel
    keyNotifierMaxAgeDays: number
    keyNotifierMaxJobsPerType: number
    keyNotifierMaxMessagesPerJob: number
    keyParallelJobsInAnalyticsTableExport: number
    keyPhoneNumberAreaCode?: string
    keyRecaptchaSecret?: string
    keyRecaptchaSite?: string
    keyRemoteInstancePassword?: string
    keyRemoteInstanceUrl?: string
    keyRemoteInstanceUsername?: string
    keyRemoteMetadataVersion?: string
    keyRequireAddToView?: boolean
    keyRespectMetaDataStartEndDatesInAnalyticsTableExport?: boolean
    keyRuleEngineAssignOverwrite?: boolean
    keySelfRegistrationNoRecaptcha?: boolean
    keySkipDataTypeValidationInAnalyticsTableExport?: boolean
    keySmsMaxLength: number
    keySqlViewMaxLimit: number
    keyStartModule?: string
    keyStartModuleEnableLightweight?: boolean
    keyStopMetadataSync?: boolean
    keyStyle?: string
    keySyncDelayBetweenRemoteServerAvailabilityCheckAttempts: number
    keySyncMaxAttempts: number
    keySyncMaxRemoteServerAvailabilityCheckAttempts: number
    keySyncSkipSyncForDataChangedBefore?: string
    keySystemMetadataVersion?: string
    keySystemNotificationsEmail?: string
    keyTrackedEntityMaxLimit: number
    keyTrackerDashboardLayout?: string
    keyUiLocale?: string
    keyUseCustomLogoBanner?: boolean
    keyUseCustomLogoFront?: boolean
    keyUseExperimentalAnalyticsQueryEngine?: boolean
    keyVersionEnabled?: boolean
}
