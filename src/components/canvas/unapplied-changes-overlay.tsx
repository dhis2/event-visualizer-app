import i18n from '@dhis2/d2-i18n'
import cx from 'classnames'
import type { FC, PropsWithChildren } from 'react'
import classes from './styles/unapplied-changes-overlay.module.css'

type UnappliedChangesOverlayProps = PropsWithChildren<{
    hasUnappliedChanges: boolean
    isVisualizationLoading: boolean
}>

export const UnappliedChangesOverlay: FC<UnappliedChangesOverlayProps> = ({
    children,
    hasUnappliedChanges,
    isVisualizationLoading,
}) => {
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
