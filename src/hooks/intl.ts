import { useCurrentUser } from '@components/app-wrapper/app-cached-data-query-provider'
import { useMemo } from 'react'

/*
 * Mirrors the parseDhis2Locale logic from @dhis2/app-adapter (localeUtils.js).
 * DHIS2 stores locales in Java Locale.toString() format: language[_REGION[_Script]].
 * BCP 47 requires hyphens and puts script before region: language[-Script[-REGION]].
 */
const parseDhis2Locale = (locale: string): Intl.Locale => {
    const [language, region, script] = locale.split('_')
    let languageTag = language
    if (script) {
        languageTag += `-${script}`
    }
    if (region) {
        languageTag += `-${region}`
    }
    return new Intl.Locale(languageTag)
}

export const useUserIntlLocale = (): string => {
    const { settings } = useCurrentUser()
    return useMemo(
        () => parseDhis2Locale(settings.uiLocale).baseName,
        [settings.uiLocale]
    )
}

export const useListFormatter = (
    options?: Intl.ListFormatOptions
): Intl.ListFormat => {
    const locale = useUserIntlLocale()
    const { type, style, localeMatcher } = options ?? {}
    return useMemo(
        () => new Intl.ListFormat(locale, { type, style, localeMatcher }),
        [locale, type, style, localeMatcher]
    )
}
