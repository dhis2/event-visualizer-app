import cx from 'classnames'
import { useEffect, useState, type FC } from 'react'
import { Axis } from './axis'
import classes from './styles/line-list-layout.module.css'
import { useAppSelector } from '@hooks'
import { getUiLayoutPanelVisible } from '@store/ui-slice'
import { getVisUiConfigLayout } from '@store/vis-ui-config-slice'

export const LineListLayout: FC = () => {
    const { columns, filters } = useAppSelector(getVisUiConfigLayout)
    const isLayoutPanelVisible = useAppSelector(getUiLayoutPanelVisible)
    // TODO: remove the renderCount stuff
    const [renderCount, setRenderCount] = useState(1)

    useEffect(() => {
        setInterval(() => {
            setRenderCount((currentRenderCount) => currentRenderCount + 1)
        }, 2000)
    }, [])

    return (
        <div
            className={cx(classes.layoutContainer, {
                [classes.hidden]: !isLayoutPanelVisible,
            })}
        >
            <Axis axisId="columns" position="start" dimensionIds={columns} />
            <Axis axisId="filters" position="end" dimensionIds={filters} />
            <div
                style={{
                    position: 'absolute',
                    top: 8,
                    right: 300,
                    backgroundColor: 'magenta',
                    borderRadius: 4,
                    display: 'inline-block',
                }}
            >
                {renderCount}
            </div>
        </div>
    )
}
