import type { FC } from 'react'
import type { CurrentVisualization } from '@types'

type LineListPluginProps = {
    visualization: CurrentVisualization
    isInModal?: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    responses: any[] // TODO figure out the type for the response
}

export const LineListPlugin: FC<LineListPluginProps> = ({
    visualization,
    isInModal,
    responses,
}) => {
    console.log('LL plugin props', visualization, responses, isInModal)

    // TODO implement onDataSorted and any other function/callback that cannot rely on the Redux store

    return (
        <div style={{ border: '1px solid green' }}>
            <p>This is the LL plugin</p>
            <p>Showing {visualization.name}</p>
        </div>
    )
}
