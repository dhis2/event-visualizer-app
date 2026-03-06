import { IconMore16, colors } from '@dhis2/ui'
import cx from 'classnames'
import { useEffect, useMemo, type FC } from 'react'
import { useWindowSize } from 'usehooks-ts'
import { Axis } from './axis/axis'
import classes from './styles/axes.module.css'
import { ResizeHandle, useResizeHandle } from '@components/shared/resize-handle'
import { SkeletonChip } from '@components/shared/skeleton-chip'
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

export const Axes: FC = () => {
    const dispatch = useAppDispatch()
    const dataSourceId = useAppSelector(getDataSourceId)
    const isLayoutPanelExpanded = useAppSelector(getUiLayoutPanelExpanded)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const { columns, filters, rows } = useAppSelector(getVisUiConfigLayout)
    const { height } = useWindowSize()

    const maxHeight = useMemo(
        () => height * 0.2, // fallback to 20vh
        [height]
    )

    const { containerRef, size, isDragging, minReached, eventHandlers } =
        useResizeHandle({
            orientation: 'horizontal',
            storageKey: AXES_HEIGHT_STORAGE_KEY,
            min: 56,
            max: maxHeight,
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
                        ariaLabel="Resize axes panel"
                        {...eventHandlers}
                    />
                </div>
            )}
        </div>
    )
}
