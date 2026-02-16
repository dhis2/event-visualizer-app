// eslint-disable-next-line no-restricted-imports
import { type FetchError, useDataEngine } from '@dhis2/app-runtime'
import { useCallback, useState } from 'react'
import { getAdaptedVisualization } from './query-tools-line-list'
import type { OnAnalyticsResponseReceivedCb } from './use-line-list-analytics-data'
import { Analytics, transformEventAggregateResponse } from '@dhis2/analytics'
import type { CurrentUser, CurrentVisualization } from '@types'

export const fetchAnalyticsDataForPT = async ({
    analyticsEngine,
    displayProperty,
    visualization,
    relativePeriodDate,
}) => {
    const { adaptedVisualization, parameters } =
        getAdaptedVisualization(visualization)

    console.log('vis', adaptedVisualization)

    // TODO: figure out what to do for the DE time dimensions
    if (visualization.timeField) {
        parameters['timeField'] = visualization.timeField
    }

    let req = new analyticsEngine.request()
        .fromVisualization(adaptedVisualization)
        .withProgram(visualization.program?.id)
        .withOutputType(adaptedVisualization.outputType)
        .withParameters({
            totalPages: false,
            stage: visualization.programStage?.id,
            ...parameters,
        })
        .withDisplayProperty(displayProperty?.toUpperCase())

    if (visualization.programStatus) {
        req = req.withProgramStatus(visualization.programStatus)
    }

    if (relativePeriodDate) {
        req = req.withRelativePeriodDate(relativePeriodDate)
    }

    const rawResponse = await analyticsEngine.events.getAggregate(req)

    return rawResponse
}

// TODO: complete the type definition and check where to put it
export type PivotTableAnalyticsData = {
    rows: Array<Array<string>>
}

type FetchAnalyticsDataParams = {
    visualization: CurrentVisualization
    filters?: Record<string, unknown>
    displayProperty: CurrentUser['settings']['displayProperty']
    onResponseReceived: OnAnalyticsResponseReceivedCb
}
type FetchAnalyticsDataFn = (params: FetchAnalyticsDataParams) => Promise<void>
type AnalyticsDataState = {
    isFetching: boolean
    error?: FetchError
    data: PivotTableAnalyticsData | null
}
type UseAnalyticsDataResult = [FetchAnalyticsDataFn, AnalyticsDataState]

const usePivotTableAnalyticsData = (): UseAnalyticsDataResult => {
    const dataEngine = useDataEngine()
    const [analyticsEngine] = useState(() => Analytics.getAnalytics(dataEngine))

    const [state, setState] = useState<AnalyticsDataState>({
        isFetching: false,
        error: undefined,
        data: null,
    })

    const fetchAnalyticsData: FetchAnalyticsDataFn = useCallback(
        async ({
            visualization,
            filters,
            displayProperty,
            onResponseReceived,
        }) => {
            setState((prevState) => ({
                ...prevState,
                isFetching: true,
                error: undefined,
            }))

            const relativePeriodDate = filters?.relativePeriodDate

            try {
                const analyticsResponse = await fetchAnalyticsDataForPT({
                    analyticsEngine,
                    displayProperty,
                    visualization,
                    relativePeriodDate,
                })

                // response for PT needs to be transformed
                const analyticsData =
                    transformEventAggregateResponse(analyticsResponse)

                console.log('analytics data', analyticsData)
                setState({
                    data: analyticsData,
                    error: undefined,
                    isFetching: false,
                })

                // TODO: enable this once the metadata PR is merged
                onResponseReceived(analyticsResponse.metaData.items, [])
            } catch (error) {
                console.log('PT fetch error', error)
                setState({
                    data: null,
                    error,
                    isFetching: false,
                })
            }
        },
        [analyticsEngine]
    )

    return [fetchAnalyticsData, state]
}

export { usePivotTableAnalyticsData }
