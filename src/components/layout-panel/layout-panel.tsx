import { IconMore16 } from '@dhis2/ui'
import cx from 'classnames'
import type { FC } from 'react'
import { Axes } from './axes'
import { BottomBar } from './bottom-bar/bottom-bar'
import classes from './styles/layout-panel.module.css'
import { TopBar } from './top-bar/top-bar'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    getUiLayoutPanelExpanded,
    getUiLayoutPanelVisible,
    toggleUiLayoutPanelExpanded,
} from '@store/ui-slice'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'

const ExpandLayoutPanelButton: FC = () => {
    const dispatch = useAppDispatch()

    return (
        <div
            className={classes.expandButton}
            onClick={() => dispatch(toggleUiLayoutPanelExpanded())}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    dispatch(toggleUiLayoutPanelExpanded())
                }
            }}
        >
            <IconMore16 color="var(--colors-grey800)" />
        </div>
    )
}

export const LayoutPanel: FC = () => {
    const isLayoutPanelExpanded = useAppSelector(getUiLayoutPanelExpanded)
    const isLayoutPanelVisible = useAppSelector(getUiLayoutPanelVisible)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)

    return isLayoutPanelVisible ? (
        <div className={classes.panel}>
            <TopBar />
            {isLayoutPanelExpanded ? (
                <div
                    className={cx(classes.container, {
                        [classes.lineList]: visualizationType === 'LINE_LIST',
                    })}
                >
                    <Axes />
                </div>
            ) : (
                <ExpandLayoutPanelButton />
            )}
            <BottomBar />
        </div>
    ) : null
}
