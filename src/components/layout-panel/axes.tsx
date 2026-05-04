import { SkeletonChip } from '@components/shared/skeleton-chip'
import i18n from '@dhis2/d2-i18n'
import { IconMore16, colors } from '@dhis2/ui'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'
import {
    getUiLayoutPanelExpanded,
    toggleUiLayoutPanelExpanded,
} from '@store/ui-slice'
import {
    getVisUiConfigLayout,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import cx from 'classnames'
import { useEffect, type CSSProperties, type FC } from 'react'
import { Axis } from './axis/axis'
import { ResizeHandle } from './resize-handle'
import classes from './styles/axes.module.css'
import { useResizeHandle } from './use-resize-handle'

const ExpandLayoutPanelButton: FC = () => {
    const dispatch = useAppDispatch()

    return (
        <button
            className={classes.expandButton}
            onClick={() => dispatch(toggleUiLayoutPanelExpanded())}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    dispatch(toggleUiLayoutPanelExpanded())
                }
            }}
        >
            <IconMore16 color={colors.grey800} />
        </button>
    )
}

const LoadingSkeletons: FC = () => (
    <div
        className={classes.loadingSkeletons}
        data-test="axes-loading-skeletons"
    >
        <SkeletonChip width={120} />
        <SkeletonChip width={90} />
        <SkeletonChip width={120} />
        <SkeletonChip width={90} />
    </div>
)

const AXES_HEIGHT_STORAGE_KEY = 'dhis2.event-visualizer.axesHeight'
const MIN_AXES_HEIGHT = 56

export const Axes: FC = () => {
    const dispatch = useAppDispatch()
    const dataSourceId = useAppSelector(getDataSourceId)
    const isLayoutPanelExpanded = useAppSelector(getUiLayoutPanelExpanded)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const { columns, filters, rows } = useAppSelector(getVisUiConfigLayout)

    const {
        containerRef,
        contentRef,
        eventHandlers,
        isDragging,
        minReached,
        size,
    } = useResizeHandle({
        orientation: 'horizontal',
        storageKey: AXES_HEIGHT_STORAGE_KEY,
        min: MIN_AXES_HEIGHT,
    })

    useEffect(() => {
        if (minReached) {
            dispatch(toggleUiLayoutPanelExpanded())
        }
    }, [minReached, dispatch])

    if (isVisualizationLoading) {
        return <LoadingSkeletons />
    } else if (!isLayoutPanelExpanded && dataSourceId) {
        return <ExpandLayoutPanelButton />
    }

    /* When the user has dragged the panel to an explicit size we lock that
     * size in via inline style and disable the default 20vh CSS cap so the
     * panel can grow up to the available content height. With no stored size
     * we let CSS handle natural growth (auto height capped at 20vh). */
    const containerStyle: CSSProperties | undefined =
        size !== null ? { blockSize: size, maxBlockSize: 'none' } : undefined

    return (
        <div
            className={cx(classes.axes, {
                [classes.empty]: !dataSourceId,
            })}
        >
            {dataSourceId && (
                <div
                    ref={containerRef}
                    className={classes.container}
                    style={containerStyle}
                >
                    <div className={classes.scroller}>
                        <div
                            className={cx(classes.axisContainer, {
                                [classes.lineList]:
                                    visualizationType === 'LINE_LIST',
                            })}
                            ref={contentRef}
                        >
                            <Axis axisId="columns" dimensionIds={columns} />
                            {visualizationType !== 'LINE_LIST' && (
                                <Axis axisId="rows" dimensionIds={rows} />
                            )}
                            <Axis axisId="filters" dimensionIds={filters} />
                        </div>
                    </div>
                    <ResizeHandle
                        isDragging={isDragging}
                        orientation="horizontal"
                        ariaLabel={i18n.t('Resize axes panel')}
                        {...eventHandlers}
                    />
                </div>
            )}
        </div>
    )
}
