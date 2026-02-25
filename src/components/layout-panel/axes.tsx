import cx from 'classnames'
import { useState, type FC } from 'react'
import { Axis } from './axis/axis'
import classes from './styles/axes.module.css'
import { useAppSelector } from '@hooks'
import {
    getVisUiConfigLayout,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'

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
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize axes panel"
        />
    )
}

export const Axes: FC = () => {
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const { columns, filters, rows } = useAppSelector(getVisUiConfigLayout)

    return (
        <div>
            <div
                className={cx(classes.axes, {
                    [classes.lineList]: visualizationType === 'LINE_LIST',
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
    )
}
