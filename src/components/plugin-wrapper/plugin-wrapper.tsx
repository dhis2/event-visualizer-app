// eslint-disable-next-line  no-restricted-imports
import { useDataEngine } from '@dhis2/app-runtime'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { LineListPlugin } from './line-list-plugin'
import { PivotTablePlugin } from './pivot-table-plugin'
import { Analytics, transformEventAggregateResponse } from '@dhis2/analytics'
import { CurrentVisualization } from '@types'

type PluginWrapperProps = {
    visualization: CurrentVisualization
    isInModal?: boolean // passed when viewing an intepretation via the InterpretationModal from analytics
    filters?: Record<string, string> // XXX verify this type
}

export const PluginWrapper: FC<PluginWrapperProps> = ({
    visualization,
    filters,
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
    const dataEngine = useDataEngine()
    const [analyticsEngine] = useState(() => Analytics.getAnalytics(dataEngine))

    const [responses, setResponses] = useState<unknown[]>([])

    useEffect(() => {
        const fetchData = async () => {
            if (visualization.type === 'LINE_LIST') {
                let req = new analyticsEngine.request()
                    .fromVisualization(visualization)
                    .withProgram(visualization.program?.id)
                    //.withDisplayProperty(displayProperty.toUpperCase())
                    .withIncludeMetadataDetails()

                if (filters?.relativePeriodDate) {
                    req = req.withRelativePeriodDate(filters.relativePeriodDate)
                }

                const rawResponse = await analyticsEngine['events'].getQuery(
                    req
                )

                //    const { adaptedVisualization, headers, parameters } =
                //        getAdaptedVisualization(visualization)
                //
                //    let req = new analyticsEngine.request()
                //        .fromVisualization(adaptedVisualization)
                //        .withParameters({
                //            headers,
                //            totalPages: false,
                //            ...(visualization.outputType !== OUTPUT_TYPE_EVENT
                //                ? { rowContext: true }
                //                : {}),
                //            ...parameters,
                //        })
                //        .withDisplayProperty(displayProperty.toUpperCase())
                //        .withPageSize(pageSize)
                //        .withPage(page)
                //        .withIncludeMetadataDetails()
                //
                //    // trackedEntity request can use multiple programs
                //    if (visualization.outputType !== OUTPUT_TYPE_TRACKED_ENTITY) {
                //        req = req
                //            .withProgram(visualization.program.id)
                //            .withOutputType(visualization.outputType)
                //    }
                //
                //    if (visualization.outputType === OUTPUT_TYPE_EVENT) {
                //        req = req.withStage(visualization.programStage?.id)
                //    }
                //
                //    if (visualization.outputType === OUTPUT_TYPE_TRACKED_ENTITY) {
                //        req = req.withTrackedEntityType(visualization.trackedEntityType.id)
                //    }
                //
                //    if (filters?.relativePeriodDate && isAoWithTimeDimension(visualization)) {
                //        req = req.withRelativePeriodDate(filters.relativePeriodDate)
                //    }
                //
                //    if (sortField) {
                //        switch (sortDirection) {
                //            case 'asc':
                //                req = req.withAsc(sortField)
                //                break
                //            case 'desc':
                //                req = req.withDesc(sortField)
                //                break
                //        }
                //    }
                //
                //    const analyticsApiEndpoint = getAnalyticsEndpoint(visualization.outputType)
                //
                //    const rawResponse = await analyticsEngine[analyticsApiEndpoint].getQuery(
                //        req
                //    )

                setResponses([rawResponse])
            } else if (visualization.type === 'PIVOT_TABLE') {
                let req = new analyticsEngine.request()
                    .fromVisualization(visualization)
                    .withProgram(visualization.program?.id)
                    //.withDisplayProperty(displayProperty.toUpperCase())
                    .withIncludeMetadataDetails()

                if (filters?.relativePeriodDate) {
                    req = req.withRelativePeriodDate(filters.relativePeriodDate)
                }

                const rawResponse = await analyticsEngine[
                    'events'
                ].getAggregate(req)

                console.log('PT rawResponse', rawResponse)

                setResponses([
                    new analyticsEngine.response(
                        transformEventAggregateResponse(rawResponse)
                    ),
                ])
            }
        }

        fetchData()
    }, [visualization, filters, analyticsEngine])

    if (visualization.type === 'LINE_LIST') {
        return (
            responses.length && (
                <LineListPlugin
                    visualization={visualization}
                    responses={responses}
                    {...props}
                />
            )
        )
    } else if (visualization.type === 'PIVOT_TABLE') {
        return (
            responses.length && (
                <PivotTablePlugin
                    visualization={visualization}
                    responses={responses}
                    legendSets={[]} // TODO fetch legendSets in the custom endpoint for analytics?!
                    {...props}
                />
            )
        )
    }
}
