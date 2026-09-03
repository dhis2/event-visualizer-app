import {
    toLineListAnalyticsData,
    type LineListAnalyticsData,
    type LineListAnalyticsResponse,
    type LineListLegendSet,
} from '@components/plugin-wrapper/hooks/use-line-list-analytics-data'
import { getInitialMetadata } from '@modules/metadata/initial-metadata'
import { MetadataStore } from '@modules/metadata/store'
import { extractMetadataFromVisualization } from '@modules/metadata/visualization'
import type {
    CurrentVisualization,
    MetadataInputMap,
    SavedVisualization,
} from '@types'

/* A line-list fixture holds the fetch hook's raw inputs: the visualization
 * (as the app loads it), the verbatim analytics response and the fetched
 * legend sets. See the capture script in src/test-utils for regeneration. */
export type LineListFixture = {
    visualization: unknown
    response: unknown
    legendSets?: unknown
    /* Store state the app only builds in the editor (e.g. legendSetIds
     * fetched per data item), which loading a visualization does not seed. */
    metadata?: unknown
}

/* Derives the fetch hook's output with the same function the hook uses, so
 * tests exercise the real contract between the hooks. */
export const deriveLineListAnalyticsData = (
    fixture: LineListFixture
): LineListAnalyticsData =>
    toLineListAnalyticsData({
        response: fixture.response as LineListAnalyticsResponse,
        visualization: fixture.visualization as CurrentVisualization,
        legendSets: fixture.legendSets as LineListLegendSet[],
    })

/* Seeds a metadata store from fixture visualizations with the same
 * extraction that loading a visualization runs at runtime. Additive (unlike
 * setVisualizationMetadata, which also removes), so one store can serve
 * tests spanning multiple fixtures. */
export const createLineListFixtureMetadataStore = (
    fixtures: Array<Pick<LineListFixture, 'visualization' | 'metadata'>>
): MetadataStore => {
    const store = new MetadataStore(getInitialMetadata())
    for (const fixture of fixtures) {
        store.addMetadata(
            extractMetadataFromVisualization(
                fixture.visualization as SavedVisualization
            )
        )
        if (fixture.metadata) {
            store.addMetadata(fixture.metadata as MetadataInputMap)
        }
    }
    return store
}
