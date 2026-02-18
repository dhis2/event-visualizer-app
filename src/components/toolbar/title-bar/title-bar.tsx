import i18n from '@dhis2/d2-i18n'
import { Tooltip } from '@dhis2/ui'
import cx from 'classnames'
import type { FC, ReactNode } from 'react'
import classes from './styles/title-bar.module.css'
import { useAppSelector } from '@hooks'
import { getVisualizationState } from '@modules/visualization'
import { getCurrentVis } from '@store/current-vis-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'
import { getSavedVis } from '@store/saved-vis-slice'
import type { CurrentVisualization, VisualizationState } from '@types'

export const getTitleLoading = () => i18n.t('Loading visualization')
export const getTitleUnsaved = () => i18n.t('Unsaved visualization')
export const getTitleDirty = () => i18n.t('Edited')

const getTitleText = (
    titleState: VisualizationState,
    visualization: CurrentVisualization
): string | undefined => {
    switch (titleState) {
        case 'UNSAVED':
            return getTitleUnsaved()
        case 'SAVED':
        case 'DIRTY':
            return visualization.displayName
        default:
            return ''
    }
}

const getSuffix = (titleState: VisualizationState): ReactNode =>
    titleState === 'DIRTY' ? (
        <div className={cx(classes.suffix, classes.edited)}>
            {getTitleDirty()}
        </div>
    ) : (
        ''
    )

export const TitleBar: FC = () => {
    const currentVis = useAppSelector(getCurrentVis)
    const savedVis = useAppSelector(getSavedVis)

    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)

    const titleState = getVisualizationState(savedVis, currentVis)
    const titleText = isVisualizationLoading
        ? getTitleLoading()
        : getTitleText(titleState, currentVis)

    return (
        <div data-test="title-bar" className={classes.titleBar}>
            <div className={classes.titleContainer}>
                {titleText && (
                    <Tooltip content={titleText} closeDelay={0} openDelay={500}>
                        {({ ref, onMouseOver, onMouseOut }) => (
                            <span
                                ref={ref}
                                onMouseOver={onMouseOver}
                                onMouseOut={onMouseOut}
                                className={classes.cell}
                            >
                                <span
                                    data-test="title-text"
                                    className={cx(classes.title, {
                                        [classes.loading]:
                                            isVisualizationLoading,
                                        [classes.unsaved]:
                                            titleState === 'UNSAVED',
                                    })}
                                >
                                    {titleText}
                                </span>
                                {getSuffix(titleState)}
                            </span>
                        )}
                    </Tooltip>
                )}
            </div>
        </div>
    )
}
