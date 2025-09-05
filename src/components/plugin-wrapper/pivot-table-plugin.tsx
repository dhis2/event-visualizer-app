import type { FC } from 'react'
import { PivotTable } from '@dhis2/analytics'
import { CurrentVisualization } from '@types'

type PivotTablePluginProps = {
    visualization: CurrentVisualization
    //    filters?: Record<string, string>
    //    isInModal?: boolean
    responses: Record<string, string>[] // TODO figure out the type for the response
    legendSets: Record<string, string>[]
    //    id?: number
    style?: Record<string, string>
}

const STYLE_PROP_DEFAULT = {}

export const PivotTablePlugin: FC<PivotTablePluginProps> = ({
    visualization,
    responses,
    legendSets,
    style = STYLE_PROP_DEFAULT,
}) => {
    console.log('PT plugin props', visualization, responses, legendSets, style)

    return (
        <div style={style}>
            <PivotTable
                visualization={visualization}
                data={responses[0]} // XXX responses[0].response
                legendSets={legendSets}
                //renderCounter={id}
            />
        </div>
    )
}
