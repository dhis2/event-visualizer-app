import { type FC } from 'react'
import { Axis } from './axis/axis'
import { useAppSelector } from '@hooks'
import {
    getVisUiConfigLayout,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'

export const Axes: FC = () => {
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const { columns, filters, rows } = useAppSelector(getVisUiConfigLayout)

    return (
        <>
            <Axis axisId="columns" dimensionIds={columns} />
            {visualizationType !== 'LINE_LIST' && (
                <Axis axisId="rows" dimensionIds={rows} />
            )}
            <Axis axisId="filters" dimensionIds={filters} />
        </>
    )
}
