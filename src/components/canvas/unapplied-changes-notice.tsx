import i18n from '@dhis2/d2-i18n'
import { IconWarningFilled16, colors } from '@dhis2/ui'
import { useAppSelector } from '@hooks'
import { getIsVisualizationLoading } from '@store/loader-slice'
import type { FC } from 'react'
import classes from './styles/unapplied-changes-notice.module.css'
import { useHasUnappliedChanges } from './use-has-unapplied-changes'

export const UnappliedChangesNotice: FC = () => {
    const hasUnappliedChanges = useHasUnappliedChanges()
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)

    if (!hasUnappliedChanges || isVisualizationLoading) {
        return null
    }

    return (
        <div
            className={classes.notice}
            role="status"
            aria-live="polite"
            data-test="unapplied-changes-notice"
        >
            <IconWarningFilled16 color={colors.yellow700} />
            <span>{i18n.t('Unapplied changes')}</span>
        </div>
    )
}
