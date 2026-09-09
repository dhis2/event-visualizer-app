import type { MockOptions } from '@test-utils/app-wrapper'

/* A line-list fixture holds verbatim API responses: the eventVisualization
 * payload, the analytics response and the fetched legend sets. */
export type LineListFixture = {
    eventVisualization: unknown
    response: unknown
    legendSets?: unknown
}

const fixtureFiles = import.meta.glob('../__fixtures__/*/*.json', {
    eager: true,
    import: 'default',
}) as Record<string, unknown>

/* Loads a fixture directory (see the README in __fixtures__) by name. */
export const loadLineListFixture = (name: string): LineListFixture => {
    const file = (fileName: string) =>
        fixtureFiles[`../__fixtures__/${name}/${fileName}.json`]
    const eventVisualization = file('event-visualization')
    const response = file('analytics')
    if (!eventVisualization || !response) {
        throw new Error(`No fixture found with name "${name}"`)
    }
    return {
        eventVisualization,
        response,
        legendSets: file('legend-sets') ?? [],
    }
}

/* Mock API responses for rendering through the real load pipeline (see
 * visualization-test-host.tsx). The extra empty resources satisfy the load
 * thunk's side requests. */
type QueryData = NonNullable<MockOptions['queryData']>

export const getLineListFixtureQueryData = (
    fixture: LineListFixture,
    overrides: QueryData = {}
): QueryData => ({
    eventVisualizations: fixture.eventVisualization as QueryData[string],
    analytics: fixture.response as QueryData[string],
    legendSets: { legendSets: fixture.legendSets } as QueryData[string],
    options: { options: [] } as QueryData[string],
    dataStatistics: {} as QueryData[string],
    ...overrides,
})
