import { useHasUnappliedChanges } from '@components/layout-panel/bottom-bar/use-has-unapplied-changes'
import i18n from '@dhis2/d2-i18n'
import { useAppSelector } from '@hooks'
import { getIsVisualizationLoading } from '@store/loader-slice'
import cx from 'classnames'
import type { FC, PropsWithChildren } from 'react'
import classes from './styles/unapplied-changes-overlay.module.css'

export const UnappliedChangesOverlay: FC<PropsWithChildren> = ({
    children,
}) => {
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const hasUnappliedChanges = useHasUnappliedChanges()
    const isStale = hasUnappliedChanges && !isVisualizationLoading

    return (
        <div className={classes.container}>
            <div className={cx(classes.content, { [classes.stale]: isStale })}>
                {children}
            </div>
            <div
                className={cx(classes.notice, { [classes.visible]: isStale })}
                aria-hidden={!isStale}
                data-test="unapplied-changes"
            >
                {i18n.t('Changes not applied')}
            </div>
        </div>
    )
}
