import i18n from '@dhis2/d2-i18n'
import { Button, Cover, IconInfo24, colors } from '@dhis2/ui'
import type { DashboardFilters } from '@types'
import type { FC } from 'react'
import { useState } from 'react'
import classes from './styles/filters-not-applied-notice.module.css'

export const hasUnappliedFilters = (filters?: DashboardFilters): boolean =>
    Boolean(
        filters?.ou?.length ||
        filters?.pe?.length ||
        Object.values(filters?.yourDimensions ?? {}).some(
            (items) => items.length
        )
    )

type FiltersNotAppliedNoticeProps = {
    filters?: DashboardFilters
    /* Hidden while loading so its opaque Cover doesn't hide the canvas spinner.
     * Suppressed here rather than unmounted, so a dismissal survives the load. */
    isLoading?: boolean
}

export const FiltersNotAppliedNotice: FC<FiltersNotAppliedNoticeProps> = ({
    filters,
    isLoading = false,
}) => {
    /* Dismissal is keyed on the filters, so a filter change no longer matches
     * and the notice reappears — no effect needed. */
    const filtersKey = JSON.stringify(filters ?? null)
    const [dismissedFiltersKey, setDismissedFiltersKey] = useState<
        string | null
    >(null)

    if (
        isLoading ||
        !hasUnappliedFilters(filters) ||
        dismissedFiltersKey === filtersKey
    ) {
        return null
    }

    return (
        <Cover dataTest="filters-not-applied-notice">
            <div
                className={classes.messageContent}
                role="status"
                aria-live="polite"
            >
                <IconInfo24 color={colors.grey500} />
                <span>
                    {i18n.t('Filters are not applied to Event visualizations')}
                </span>
                <Button
                    secondary
                    small
                    dataTest="filters-not-applied-dismiss"
                    onClick={() => setDismissedFiltersKey(filtersKey)}
                >
                    {i18n.t('Show without filters')}
                </Button>
            </div>
        </Cover>
    )
}
