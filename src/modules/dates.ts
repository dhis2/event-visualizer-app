import { useCallback, useMemo } from 'react'
import { useCurrentUser } from '@hooks'

export const getStartEndDate = (startEndDate: string): Array<string> => {
    const parts = startEndDate.split('_')
    return parts.length === 2 &&
        !isNaN(Date.parse(parts[0])) &&
        !isNaN(Date.parse(parts[1]))
        ? parts
        : []
}

export const isStartEndDate = (id: string): boolean =>
    getStartEndDate(id).length === 2

type UseLocalizedStartEndDateFormatterResult = (startEndDate: string) => string

export const useLocalizedStartEndDateFormatter =
    (): UseLocalizedStartEndDateFormatterResult => {
        const currentUser = useCurrentUser()

        const formatter = useMemo(
            () =>
                new Intl.DateTimeFormat(currentUser.settings.uiLocale, {
                    dateStyle: 'long',
                }),
            [currentUser]
        )

        return useCallback(
            (startEndDate) =>
                getStartEndDate(startEndDate)
                    .map((dateStr: string) =>
                        formatter.format(new Date(dateStr))
                    )
                    .join(' - '),
            [formatter]
        )
    }
