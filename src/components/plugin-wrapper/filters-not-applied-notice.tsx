import i18n from '@dhis2/d2-i18n'
import { Button, Cover, IconInfo24, colors } from '@dhis2/ui'
import type { HostFilters } from '@types'
import type { FC } from 'react'
import { useState } from 'react'
import classes from './styles/filters-not-applied-notice.module.css'

export const hasUnappliedFilters = (filters?: HostFilters): boolean =>
    Boolean(
        filters?.ou?.length ||
        filters?.pe?.length ||
        Object.values(filters?.yourDimensions ?? {}).some(
            (items) => items.length
        )
    )

type FiltersNotAppliedNoticeProps = {
    filters?: HostFilters
    /* While the canvas is showing its own loading spinner, the notice's
     * near-opaque Cover would sit on top of it and hide it. Suppressing the
     * notice here (rather than unmounting it from the parent) keeps its
     * dismissal state intact, so it reappears afterwards only if the filter
     * is still unapplied and wasn't already dismissed for that filter. */
    isLoading?: boolean
}

export const FiltersNotAppliedNotice: FC<FiltersNotAppliedNoticeProps> = ({
    filters,
    isLoading = false,
}) => {
    /* Keying the dismissal off the filters themselves (rather than an effect)
     * means a filter change simply no longer matches the dismissed key, so
     * the notice reappears without any extra state to keep in sync. */
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
                    {i18n.t(
                        'Filters are not applied to line list and pivot table dashboard items'
                    )}
                </span>
                <Button
                    secondary
                    small
                    dataTest="filters-not-applied-dismiss"
                    onClick={() => setDismissedFiltersKey(filtersKey)}
                >
                    {i18n.t('Dismiss')}
                </Button>
            </div>
        </Cover>
    )
}
