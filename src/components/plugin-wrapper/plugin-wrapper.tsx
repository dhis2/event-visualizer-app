import type { FC } from 'react'
import { LineListPlugin } from './line-list-plugin'
import { PivotTablePlugin } from './pivot-table-plugin'
import { CurrentVisualization } from '@types'

type PluginWrapperProps = {
    visualization: CurrentVisualization
    isInModal?: boolean // passed when viewing an intepretation via the InterpretationModal from analytics
    filters?: Record<string, string> // XXX verify this type
}

export const PluginWrapper: FC<PluginWrapperProps> = ({
    visualization,
    ...props
}) => {
    console.log('plugin wrapper received visualization', visualization)
    console.log('plugin wrapper received props', props)

    // TODO handle dashboard filters here depending on vis type?!

    // TODO filters.relativePeriodDate is also passed when viewing an interpretation via the InterpretationModal from analytics
    // this needs to be used when requesting analytics data
    // props.isInModal is also passed in this case

    // TODO fetch analytics here and pass the responses to the plugin
    // (for PT the transformation needs to be applied to the responses)
    const responses = []

    if (visualization.type === 'LINE_LIST') {
        return (
            <LineListPlugin
                visualization={visualization}
                responses={responses}
                {...props}
            />
        )
    } else if (visualization.type === 'PIVOT_TABLE') {
        return (
            <PivotTablePlugin
                visualization={visualization}
                responses={responses}
                legendSets={[]} // TODO fetch legendSets in the custom endpoint for analytics?!
                {...props}
            />
        )
    }
}
