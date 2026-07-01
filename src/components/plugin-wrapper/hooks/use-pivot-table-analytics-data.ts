import { Analytics, transformEventAggregateResponse } from '@dhis2/analytics'
// eslint-disable-next-line no-restricted-imports
import { type FetchError, useDataEngine } from '@dhis2/app-runtime'
import { logger } from '@modules/logger'
import { getSingleProgramFromVisualization } from '@modules/visualization/program'
import type { CurrentUser, CurrentVisualization } from '@types'
import { useCallback, useState } from 'react'
import { getAnalyticsEndpoint } from './query-tools-common'
import { getAdaptedVisualization } from './query-tools-pivot-table'

type FetchAnalyticsDataForPTInternalParams = {
    analyticsEngine: ReturnType<typeof Analytics.getAnalytics>
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization
    relativePeriodDate: unknown
}

export const fetchAnalyticsDataForPT = async ({
    analyticsEngine,
    displayProperty,
    visualization,
    relativePeriodDate,
}: FetchAnalyticsDataForPTInternalParams) => {
    const { adaptedVisualization, parameters } =
        getAdaptedVisualization(visualization)

    logger.debug('adaptedVisualization', adaptedVisualization)

    // TODO: figure out what to do for the DE time dimensions
    const { timeField } = visualization

    const program = getSingleProgramFromVisualization(visualization)

    let req = new analyticsEngine.request()
        .fromVisualization(adaptedVisualization)
        .withProgram(program.id)
        .withParameters({
            totalPages: false,
            ...parameters,
            ...(timeField ? { timeField } : {}),
        })

    if (displayProperty) {
        req = req.withDisplayProperty(displayProperty.toUpperCase())
    }

    if (visualization.sortOrder) {
        req = req.withSortOrder(visualization.sortOrder === 1 ? 'ASC' : 'DESC')
    }

    if (visualization.topLimit) {
        req = req.withLimit(visualization.topLimit)
    }

    // add custom value and aggregationType
    if (visualization.value && visualization.aggregationType) {
        req = req
            .withValue(visualization.value.id)
            .withAggregationType(visualization.aggregationType)
    }

    if (relativePeriodDate) {
        req = req.withRelativePeriodDate(relativePeriodDate)
    }

    const analyticsApiEndpoint = getAnalyticsEndpoint(visualization.outputType)

    const rawResponse =
        await analyticsEngine[analyticsApiEndpoint].getAggregate(req)

    return rawResponse
}

// TODO: complete the type definition and check where to put it
type Row = Array<string>

export type PivotTableAnalyticsData = {
    rows: Array<Row>
    pager: {
        page: number
        pageSize: number
        isLastPage: boolean
    }
}

type FetchAnalyticsDataForPTParams = {
    visualization: CurrentVisualization
    filters?: Record<string, unknown>
    displayProperty: CurrentUser['settings']['displayProperty']
    onResponseReceived: () => void
}
type FetchAnalyticsDataFn = (
    params: FetchAnalyticsDataForPTParams
) => Promise<void>
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
                    visualization,
                    displayProperty,
                    relativePeriodDate,
                })

                logger.debug('PT analytics response', analyticsResponse)

                // response for PT needs to be transformed
                const analyticsData =
                    transformEventAggregateResponse(analyticsResponse)

                setState({
                    data: analyticsData,
                    error: undefined,
                    isFetching: false,
                })

                onResponseReceived()
            } catch (error) {
                logger.error('PT fetch error', error)
                setState({
                    data: null,
                    error: error as FetchError,
                    isFetching: false,
                })
            }
        },
        [analyticsEngine]
    )

    return [fetchAnalyticsData, state]
}

export { usePivotTableAnalyticsData }
