// eslint-disable-next-line  no-restricted-imports
import { useDataEngine } from '@dhis2/app-runtime'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { LineListPlugin } from './line-list-plugin'
import { PivotTablePlugin } from './pivot-table-plugin'
import { Analytics, transformEventAggregateResponse } from '@dhis2/analytics'
import type { CurrentUser, CurrentVisualization } from '@types'

type PluginWrapperProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization
    isInModal?: boolean // passed when viewing an intepretation via the InterpretationModal from analytics
    filters?: Record<string, string> // XXX verify this type
    onResponsesReceived?: (responses: unknown[]) => void
}

export const PluginWrapper: FC<PluginWrapperProps> = ({
    displayProperty,
    visualization,
    filters,
    onResponsesReceived,
    ...props
}) => {
    console.log(
        'plugin wrapper received',
        visualization,
        filters,
        displayProperty
    )
    console.log('plugin wrapper received other props', props)

    // TODO handle dashboard filters here depending on vis type?!

    // filters.relativePeriodDate is passed when viewing an interpretation via the InterpretationModal from analytics
    // this needs to be used when requesting analytics data
    // props.isInModal is also passed in this case

    const dataEngine = useDataEngine()
    const [analyticsEngine] = useState(() => Analytics.getAnalytics(dataEngine))

    const [responses, setResponses] = useState<unknown[]>([])

    useEffect(() => {
        const fetchData = async () => {
            if (visualization.type === 'LINE_LIST') {
                let req = new analyticsEngine.request()
                    .fromVisualization(visualization)
                    .withProgram(visualization.program?.id)
                    .withDisplayProperty(displayProperty?.toUpperCase())
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
                //                const analyticsApiEndpoint = getAnalyticsEndpoint(
                //                    visualization.outputType
                //                )

                const rawResponse = await analyticsEngine[
                    'events' //analyticsApiEndpoint
                ].getQuery(req)

                onResponsesReceived?.(rawResponse)
                setResponses([rawResponse])
            } else if (visualization.type === 'PIVOT_TABLE') {
                let req = new analyticsEngine.request()
                    .fromVisualization(visualization)
                    .withProgram(visualization.program?.id)
                    .withDisplayProperty(displayProperty?.toUpperCase())
                    .withIncludeMetadataDetails()

                if (filters?.relativePeriodDate) {
                    req = req.withRelativePeriodDate(filters.relativePeriodDate)
                }

                const rawResponse = await analyticsEngine[
                    'events'
                ].getAggregate(req)

                console.log('PT rawResponse', rawResponse)

                // response for PT needs to be transformed
                const transformedResponse =
                    transformEventAggregateResponse(rawResponse)

                onResponsesReceived?.(rawResponse)
                setResponses([
                    new analyticsEngine.response(transformedResponse),
                ])
            }
        }

        fetchData()
    }, [
        displayProperty,
        filters,
        visualization,
        analyticsEngine,
        onResponsesReceived,
    ])

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
