import i18n from '@dhis2/d2-i18n'
import cx from 'classnames'
import type { FC, ReactNode } from 'react'
import classes from './styles/title-bar.module.css'
import { useAppSelector } from '@hooks'
import { getVisualizationState } from '@modules/visualization'
import { getCurrentVis } from '@store/current-vis-slice'
import { getSavedVis } from '@store/saved-vis-slice'
import type { CurrentVisualization, VisualizationState } from '@types'

export const getTitleUnsaved = () => i18n.t('Unsaved visualization')
export const getTitleDirty = () => i18n.t('Edited')

const defaultTitleClasses = `${classes.cell} ${classes.title}`

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

const getCustomTitleClasses = (titleState: VisualizationState): string =>
    titleState === 'UNSAVED' ? classes.titleUnsaved : ''

const getSuffix = (titleState: VisualizationState): ReactNode =>
    titleState === 'DIRTY' ? (
        <div
            className={cx(classes.titleDirty, classes.suffix)}
        >{`- ${getTitleDirty()}`}</div>
    ) : (
        ''
    )

export const TitleBar: FC = () => {
    const currentVis = useAppSelector(getCurrentVis)
    const savedVis = useAppSelector(getSavedVis)

    const titleState = getVisualizationState(savedVis, currentVis)
    const titleText = getTitleText(titleState, currentVis)

    const titleClasses = `${defaultTitleClasses} ${getCustomTitleClasses(
        titleState
    )}`

    return titleText ? (
        <div data-test="title-bar" className={classes.titleBar}>
            <div className={classes.titleContainer}>
                <div className={titleClasses}>
                    {titleText}
                    {getSuffix(titleState)}
                </div>
            </div>
        </div>
    ) : null
}
