import { Analytics, transformEventAggregateResponse } from '@dhis2/analytics'
// eslint-disable-next-line no-restricted-imports
import { type FetchError, useDataEngine } from '@dhis2/app-runtime'
import { logger } from '@modules/logger'
import { getSingleProgramFromVisualization } from '@modules/visualization'
import type {
    CurrentUser,
    CurrentVisualization,
    MetadataInputItem,
    UserOrgUnitMetadataItem,
} from '@types'
import { useCallback, useState } from 'react'
import { getAnalyticsEndpoint } from './query-tools-common'
import { getAdaptedVisualization } from './query-tools-pivot-table'

export const fetchAnalyticsDataForPT = async ({
    analyticsEngine,
    displayProperty,
    visualization,
    relativePeriodDate,
}) => {
    const { adaptedVisualization, parameters } =
        getAdaptedVisualization(visualization)

    // TODO: figure out what to do for the DE time dimensions
    if (visualization.timeField) {
        parameters['timeField'] = visualization.timeField
    }

    const program = getSingleProgramFromVisualization(visualization)

    let req = new analyticsEngine.request()
        .fromVisualization(adaptedVisualization)
        .withProgram(program.id)
        .withParameters({
            totalPages: false,
            ...parameters,
        })

    if (displayProperty) {
        req = req.withDisplayProperty(displayProperty.toUpperCase())
    }

    if (visualization.programStatus) {
        req = req.withProgramStatus(visualization.programStatus)
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

export type AnalyticsResponseMetadataItems = Record<
    string,
    MetadataInputItem
> & {
    USER_ORG_UNIT?: UserOrgUnitMetadataItem
}

export type AnalyticsResponseMetadataDimensions = Record<string, string[]>
export type OnAnalyticsResponseReceivedCb = (
    items: AnalyticsResponseMetadataItems
) => void

type FetchAnalyticsDataForPTParams = {
    visualization: CurrentVisualization
    filters?: Record<string, unknown>
    displayProperty: CurrentUser['settings']['displayProperty']
    onResponseReceived: OnAnalyticsResponseReceivedCb
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

                logger.debug('analytics data', analyticsData)
                setState({
                    data: analyticsData,
                    error: undefined,
                    isFetching: false,
                })

                onResponseReceived(analyticsResponse.metaData.items)
            } catch (error) {
                logger.debug('PT fetch error', error)
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
