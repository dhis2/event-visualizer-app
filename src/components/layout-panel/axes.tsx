import { getActiveDragData } from '@components/app-wrapper/drag-and-drop-provider/dnd-data'
import { SkeletonChip } from '@components/shared/skeleton-chip'
import i18n from '@dhis2/d2-i18n'
import { IconMore16, colors } from '@dhis2/ui'
import { useDndContext } from '@dnd-kit/core'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'
import {
    getUiLayoutPanelExpanded,
    getUiLayoutPanelHeightResetCounter,
    toggleUiLayoutPanelExpanded,
} from '@store/ui-slice'
import {
    getVisUiConfigLayout,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import cx from 'classnames'
import { useEffect, useMemo, useRef, type FC } from 'react'
import { useWindowSize } from 'usehooks-ts'
import { Axis } from './axis/axis'
import { LayoutBlockedOverlay } from './layout-blocked-overlay'
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

/* Height that keeps a single axis row (label + min content area + padding)
 * fully visible. LINE_LIST stacks one such row (columns/filters); PIVOT_TABLE
 * stacks two (columns over rows), so its min is twice as tall. */
const AXIS_ROW_MIN_HEIGHT = 58

/* Height below which dragging collapses the panel. Lower than the visType min
 * so the panel can be shrunk past its default height before collapsing. */
const AXES_COLLAPSE_THRESHOLD = 24

export const Axes: FC = () => {
    const dispatch = useAppDispatch()
    const dataSourceId = useAppSelector(getDataSourceId)
    const isLayoutPanelExpanded = useAppSelector(getUiLayoutPanelExpanded)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const { columns, filters, rows } = useAppSelector(getVisUiConfigLayout)
    const heightResetCounter = useAppSelector(
        getUiLayoutPanelHeightResetCounter
    )
    const { height } = useWindowSize()
    const { active } = useDndContext()
    const activeDragData = getActiveDragData(active)

    const maxHeight = useMemo(
        () => height * 0.8, // fallback to 80vh
        [height]
    )

    const minHeight = useMemo(
        () =>
            visualizationType === 'LINE_LIST'
                ? AXIS_ROW_MIN_HEIGHT
                : AXIS_ROW_MIN_HEIGHT * 2,
        [visualizationType]
    )

    /* Signature of the layout's chips per axis. Changes when a dimension is
     * added, removed, or moved between axes — the cases that change the content
     * height and so require the panel to re-fit. */
    const contentKey = useMemo(
        () => [columns.join(','), rows.join(','), filters.join(',')].join('|'),
        [columns, rows, filters]
    )

    const {
        containerRef,
        eventHandlers,
        isDragging,
        minReached,
        resetSize,
        resetToContentHeight,
        size,
    } = useResizeHandle({
        orientation: 'horizontal',
        storageKey: AXES_HEIGHT_STORAGE_KEY,
        min: minHeight,
        collapseThreshold: AXES_COLLAPSE_THRESHOLD,
        contentKey,
        max: maxHeight,
    })

    useEffect(() => {
        if (minReached) {
            dispatch(toggleUiLayoutPanelExpanded())
        }
    }, [minReached, dispatch])

    useEffect(() => {
        if (isVisualizationLoading) {
            resetSize()
        }
    }, [isVisualizationLoading, resetSize])

    /* "Resize layout to fit" in the View menu bumps a counter; refit to content
     * on each change. The ref guards against firing on mount. */
    const prevHeightResetCounterRef = useRef(heightResetCounter)
    useEffect(() => {
        if (heightResetCounter !== prevHeightResetCounterRef.current) {
            prevHeightResetCounterRef.current = heightResetCounter
            resetToContentHeight()
        }
    }, [heightResetCounter, resetToContentHeight])

    if (isVisualizationLoading) {
        return <LoadingSkeletons />
    } else if (!isLayoutPanelExpanded && dataSourceId) {
        return <ExpandLayoutPanelButton />
    }

    return (
        <div
            className={cx(classes.axes, {
                [classes.empty]: !dataSourceId,
            })}
        >
            {dataSourceId && (
                <div
                    className={classes.container}
                    style={{ blockSize: size ?? 'auto' }}
                >
                    <div
                        className={cx(classes.axisContainer, {
                            [classes.lineList]:
                                visualizationType === 'LINE_LIST',
                            [classes.fixedHeight]: size !== null,
                        })}
                        ref={containerRef}
                    >
                        <Axis axisId="columns" dimensionIds={columns} />
                        {visualizationType !== 'LINE_LIST' && (
                            <Axis axisId="rows" dimensionIds={rows} />
                        )}
                        <Axis axisId="filters" dimensionIds={filters} />
                    </div>
                    <ResizeHandle
                        isDragging={isDragging}
                        orientation="horizontal"
                        ariaLabel={i18n.t('Resize axes panel')}
                        {...eventHandlers}
                    />
                    {active &&
                        activeDragData?.isLayoutBlocked &&
                        activeDragData.layoutBlockedMessage && (
                            <LayoutBlockedOverlay
                                message={activeDragData.layoutBlockedMessage}
                            />
                        )}
                </div>
            )}
        </div>
    )
}
