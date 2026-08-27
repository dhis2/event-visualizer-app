import i18n from '@dhis2/d2-i18n'
import { Button, Cover, IconInfo24, colors } from '@dhis2/ui'
import type { PluginFilters } from '@types'
import type { FC } from 'react'
import { useState } from 'react'
import classes from './styles/filters-not-applied-notice.module.css'

/* relativePeriodDate is applied; any other key is a dashboard filter this app
 * ignores, so its presence is what the notice warns about. */
export const hasUnappliedFilters = (filters?: PluginFilters): boolean =>
    Object.keys(filters ?? {}).some((key) => key !== 'relativePeriodDate')

type FiltersNotAppliedNoticeProps = {
    filters?: PluginFilters
    /* Hide while loading — the notice's Cover is opaque and would hide the
     * spinner. Via this flag, not by unmounting, so a dismissal survives. */
    isLoading?: boolean
}

export const FiltersNotAppliedNotice: FC<FiltersNotAppliedNoticeProps> = ({
    filters,
    isLoading = false,
}) => {
    const [dismissed, setDismissed] = useState(false)

    if (isLoading || !hasUnappliedFilters(filters) || dismissed) {
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
                    onClick={() => setDismissed(true)}
                >
                    {i18n.t('Show without filters')}
                </Button>
            </div>
        </Cover>
    )
}
