import type { FC } from 'react'
import { PivotTable } from '@dhis2/analytics'
import { CurrentVisualization } from '@types'

type PivotTablePluginProps = {
    visualization: CurrentVisualization
    //    filters?: Record<string, string>
    isInModal?: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    responses: any[] // TODO figure out the type for the response
    legendSets: Record<string, string>[]
    //    id?: number
    style?: Record<string, string>
}

const STYLE_PROP_DEFAULT = {}

export const PivotTablePlugin: FC<PivotTablePluginProps> = ({
    visualization,
    responses,
    legendSets,
    isInModal,
    style = STYLE_PROP_DEFAULT,
}) => {
    console.log(
        'PT plugin props',
        visualization,
        responses,
        legendSets,
        isInModal,
        style
    )

    // TODO implement onDataSorted and any other function/callback that cannot rely on the Redux store

    return (
        <div style={style}>
            <PivotTable
                visualization={visualization}
                data={responses[0].response}
                legendSets={legendSets}
                //renderCounter={id}
            />
        </div>
    )
}
