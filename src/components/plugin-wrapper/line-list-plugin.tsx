import type { FC } from 'react'
import { CurrentVisualization } from '@types'

type LineListPluginProps = {
    visualization: CurrentVisualization
    filters?: Record<string, string>
    isInModal?: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    responses: any[] // TODO figure out the type for the response
}

export const LineListPlugin: FC<LineListPluginProps> = ({
    visualization,
    filters,
    isInModal,
    responses,
}) => {
    console.log('LL plugin props', visualization, filters, isInModal, responses)

    // TODO implement onDataSorted and any other function/callback that cannot rely on the Redux store

    return (
        <div style={{ border: '1px solid green' }}>
            <p>This is the LL plugin</p>
            <p>{visualization.name}</p>
        </div>
    )
}
