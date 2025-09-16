import { transformEventAggregateResponse } from '@dhis2/analytics'

export const fetchAnalyticsDataForPT = async ({
    analyticsEngine,
    visualization,
    relativePeriodDate,
    displayProperty,
}) => {
    let req = new analyticsEngine.request()
        .fromVisualization(visualization)
        .withProgram(visualization.program?.id)
        .withDisplayProperty(displayProperty?.toUpperCase())
        .withIncludeMetadataDetails()

    if (relativePeriodDate) {
        req = req.withRelativePeriodDate(relativePeriodDate)
    }

    const rawResponse = await analyticsEngine['events'].getAggregate(req)

    console.log('PT rawResponse', rawResponse)

    // response for PT needs to be transformed
    const transformedResponse = transformEventAggregateResponse(rawResponse)

    console.log('PT transformedResponse', transformedResponse)

    return transformedResponse
}

const usePivotTableAnalyticsData = () => {}

export { usePivotTableAnalyticsData }
