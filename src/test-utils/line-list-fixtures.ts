import {
    toLineListAnalyticsData,
    type LineListAnalyticsData,
    type LineListAnalyticsResponse,
    type LineListLegendSet,
} from '@components/plugin-wrapper/hooks/use-line-list-analytics-data'
import type { CurrentVisualization } from '@types'

type LineListFixture = {
    visualization: unknown
    response: unknown
    legendSets?: unknown
}

/* Line-list fixtures hold the fetch hook's raw inputs (analytics response and
 * fetched legend sets); tests derive the hook's output with the same function
 * the hook uses, so they exercise the real contract between the hooks. */
export const deriveLineListAnalyticsData = (
    fixture: LineListFixture
): LineListAnalyticsData =>
    toLineListAnalyticsData({
        response: fixture.response as LineListAnalyticsResponse,
        visualization: fixture.visualization as CurrentVisualization,
        legendSets: fixture.legendSets as LineListLegendSet[],
    })
