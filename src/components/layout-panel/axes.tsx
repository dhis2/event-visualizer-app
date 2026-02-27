import { IconMore16, colors } from '@dhis2/ui'
import cx from 'classnames'
import { useState, type FC } from 'react'
import { Axis } from './axis/axis'
import classes from './styles/axes.module.css'
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

const ResizeHandle: FC = () => {
    const [isDraggingAxes /*, setIsDraggingAxes*/] = useState<boolean>(false)

    //    const handleAxesResizeStart = (e) => {
    //        e.preventDefault()
    //
    //        preDragHeightRef.current = axesMaxHeight
    //
    //        setIsDraggingAxes(true)
    //    }
    //
    //    const handleAxesResizeDoubleClick = () => {
    //        setAxesMaxHeight(null)
    //
    //        try {
    //            //            localStorage.removeItem(AXES_HEIGHT_STORAGE_KEY)
    //        } catch {
    //            // ignore
    //        }
    //    }

    return (
        <div
            className={cx(classes.resizeHandle, {
                [classes.resizeHandleActive]: isDraggingAxes,
            })}
            //onMouseDown={handleAxesResizeStart}
            //onDoubleClick={handleAxesResizeDoubleClick}
            aria-orientation="horizontal"
            aria-label="Resize axes panel"
        />
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

export const Axes: FC = () => {
    const dataSourceId = useAppSelector(getDataSourceId)
    const isLayoutPanelExpanded = useAppSelector(getUiLayoutPanelExpanded)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const { columns, filters, rows } = useAppSelector(getVisUiConfigLayout)

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
                <div className={classes.container}>
                    <div
                        className={cx(classes.axisContainer, {
                            [classes.lineList]:
                                visualizationType === 'LINE_LIST',
                        })}
                    >
                        <Axis axisId="columns" dimensionIds={columns} />
                        {visualizationType !== 'LINE_LIST' && (
                            <Axis axisId="rows" dimensionIds={rows} />
                        )}
                        <Axis axisId="filters" dimensionIds={filters} />
                    </div>
                    <ResizeHandle />
                </div>
            )}
        </div>
    )
}
