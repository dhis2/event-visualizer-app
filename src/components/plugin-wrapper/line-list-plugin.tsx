import type { FC } from 'react'
import { CurrentVisualization } from '@types'

type LineListPluginProps = {
    visualization: CurrentVisualization
    filters?: Record<string, string>
    isInModal?: boolean
    responses: Record<string, string>[] // TODO figure out the type for the response
}

export const LineListPlugin: FC<LineListPluginProps> = ({
    visualization,
    filters,
    isInModal,
    responses,
}) => {
    console.log('LL plugin props', visualization, filters, isInModal, responses)

    return (
        <div style={{ border: '1px solid green' }}>
            <p>This is the LL plugin</p>
            <p>{visualization.name}</p>
        </div>
    )
}
