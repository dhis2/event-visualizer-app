/**
 * Recaptures the line-list fixtures from the DHIS2 instance in
 * cypress.env.json, exercising the real production code path: the saved
 * visualization is loaded and normalized the way the app does it, and the
 * analytics + legendSets responses are captured verbatim from the requests
 * the real useLineListAnalyticsData hook makes.
 *
 * Skipped unless explicitly requested:
 *
 *   RECAPTURE_LINE_LIST_FIXTURES=1 pnpm exec vitest run src/test-utils/recapture-line-list-fixtures.spec.tsx
 *
 * Visualizations that no longer exist on the instance (hand-made fixture
 * variations) fall back to normalizing the fixture's stored visualization,
 * so only their response data is refreshed.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getVisualizationQueryFields } from '@api/event-visualizations-api'
import {
    useLineListAnalyticsData,
    type LineListAnalyticsData,
} from '@components/plugin-wrapper/hooks/use-line-list-analytics-data'
import { Provider } from '@dhis2/app-runtime'
import { transformVisualizationForAnalyticsRequest } from '@modules/analytics-request'
import { normalizeApiSavedVisualization } from '@modules/visualization/state'
import { renderHook, waitFor } from '@testing-library/react'
import type { CurrentVisualization, SavedVisualization } from '@types'
import type { FC, ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { describe, it, vi, expect } from 'vitest'
import { createLineListFixtureMetadataStore } from './line-list-fixtures'

const mockUseMetadataStore = vi.hoisted(() => vi.fn())
vi.mock('@components/app-wrapper/metadata-provider/metadata-provider', () => ({
    useMetadataStore: mockUseMetadataStore,
}))

const FIXTURES_DIR = resolve(__dirname, '../components/line-list/__fixtures__')
const FIXTURES = [
    { name: 'e2e-enrollment', id: 'AFjkDs7acBh' },
    {
        name: 'inpatient-cases-under-5-years-female-this-year-additional-columns-and-legends',
        id: 'jH2qePoAnHU',
    },
    { name: 'inpatient-visit-overview-this-year-bombali', id: 'kb9Uml5FEEz' },
    { name: 'no-time-dimension', id: 'asXsjGqmVr8' },
]

describe.runIf(process.env.RECAPTURE_LINE_LIST_FIXTURES)(
    'recapture line-list fixtures',
    () => {
        const cypressEnv = JSON.parse(
            readFileSync(resolve(__dirname, '../../cypress.env.json'), 'utf8')
        )
        const authHeader =
            'Basic ' +
            Buffer.from(
                `${cypressEnv.dhis2Username}:${cypressEnv.dhis2Password}`
            ).toString('base64')

        /* The data engine authenticates with cookies in the browser; here
         * every request gets basic auth injected, and JSON responses are
         * recorded so they can be saved verbatim. */
        const recorded: Array<{ url: string; body: unknown }> = []
        const realFetch = globalThis.fetch
        globalThis.fetch = (async (
            input: RequestInfo | URL,
            init?: RequestInit
        ) => {
            const url = String(input)
            const response = await realFetch(url, {
                ...init,
                credentials: undefined,
                headers: {
                    ...(init?.headers as object),
                    Authorization: authHeader,
                },
            } as RequestInit)
            try {
                recorded.push({ url, body: await response.clone().json() })
            } catch {
                // non-JSON response, ignore
            }
            return response
        }) as typeof fetch

        const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
            <Provider
                config={{
                    baseUrl: cypressEnv.dhis2BaseUrl,
                    apiVersion: Number(cypressEnv.dhis2InstanceVersion),
                }}
                userInfo={undefined}
                plugin={false}
                parentAlertsAdd={undefined}
                showAlertsInPlugin={false}
            >
                <ErrorBoundary fallback={<div>error</div>}>
                    {children}
                </ErrorBoundary>
            </Provider>
        )

        const loadVisualization = async (
            id: string,
            storedVisualization: unknown
        ): Promise<SavedVisualization> => {
            const fields = encodeURIComponent(
                getVisualizationQueryFields('displayName').join(',')
            )
            const response = await globalThis.fetch(
                `${cypressEnv.dhis2BaseUrl}/api/eventVisualizations/${id}?fields=${fields}`
            )
            const apiVisualization = response.ok
                ? await response.json()
                : /* hand-made fixture visualizations may lack the metaData
                   * field a served visualization always carries */
                  {
                      metaData: {},
                      ...(storedVisualization as Record<string, unknown>),
                  }
            return normalizeApiSavedVisualization(apiVisualization)
        }

        it.each(FIXTURES)(
            'recaptures $name',
            async ({ name, id }) => {
                const path = resolve(FIXTURES_DIR, `${name}.json`)
                const fixture = JSON.parse(readFileSync(path, 'utf8'))

                const visualization = await loadVisualization(
                    id,
                    fixture.visualization
                )
                mockUseMetadataStore.mockReturnValue(
                    createLineListFixtureMetadataStore([
                        { visualization, metadata: fixture.metadata },
                    ])
                )

                recorded.length = 0
                const { result, unmount } = renderHook(
                    () => useLineListAnalyticsData(),
                    { wrapper: Wrapper }
                )
                const [fetchAnalyticsData] = result.current
                await fetchAnalyticsData({
                    visualization: transformVisualizationForAnalyticsRequest(
                        visualization as CurrentVisualization
                    ),
                    displayProperty: 'name',
                    onResponseReceived: () => undefined,
                })
                await waitFor(() => {
                    expect(result.current[1].data).not.toBeNull()
                })
                const analyticsData = result.current[1]
                    .data as LineListAnalyticsData
                unmount()

                const analytics = recorded.find((request) =>
                    request.url.includes('/analytics/')
                )
                expect(
                    analytics,
                    `analytics response for ${name}`
                ).toBeDefined()

                writeFileSync(
                    path,
                    JSON.stringify(
                        {
                            visualization,
                            ...(fixture.metadata
                                ? { metadata: fixture.metadata }
                                : {}),
                            response: analytics!.body,
                            legendSets: analyticsData.legendSets,
                        },
                        null,
                        4
                    ) + '\n'
                )
            },
            60000
        )
    }
)
