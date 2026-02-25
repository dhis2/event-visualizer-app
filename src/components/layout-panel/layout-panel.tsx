import { IconMore16 } from '@dhis2/ui'
import { type FC } from 'react'
import { Axes } from './axes'
import { BottomBar } from './bottom-bar/bottom-bar'
import classes from './styles/layout-panel.module.css'
import { TopBar } from './top-bar/top-bar'
import { SkeletonChip } from '@components/shared/skeleton-chip'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getIsVisualizationLoading } from '@store/loader-slice'
import {
    getUiLayoutPanelExpanded,
    getUiLayoutPanelVisible,
    toggleUiLayoutPanelExpanded,
} from '@store/ui-slice'

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

const LoadingSkeletons: FC = () => (
    <div className={classes.loadingSkeletons}>
        <SkeletonChip width={120} />
        <SkeletonChip width={90} />
        <SkeletonChip width={120} />
        <SkeletonChip width={90} />
    </div>
)

export const LayoutPanel: FC = () => {
    const isLayoutPanelExpanded = useAppSelector(getUiLayoutPanelExpanded)
    const isLayoutPanelVisible = useAppSelector(getUiLayoutPanelVisible)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)

    return isLayoutPanelVisible ? (
        <div className={classes.panel}>
            <TopBar />
            {isVisualizationLoading ? (
                <LoadingSkeletons />
            ) : isLayoutPanelExpanded ? (
                <Axes />
            ) : (
                <ExpandLayoutPanelButton />
            )}
            <BottomBar />
        </div>
    ) : null
}
