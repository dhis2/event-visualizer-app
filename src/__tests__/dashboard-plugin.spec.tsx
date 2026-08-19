import type * as PluginWrapperModule from '@components/plugin-wrapper/plugin-wrapper'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { screen, waitFor } from '@testing-library/react'
import type { SavedVisualization } from '@types'
import type { ComponentProps } from 'react'
import { describe, it, expect, vi } from 'vitest'
import analyticsResponse1 from '../components/plugin-wrapper/__fixtures__/analytics-response-1.json'
import analyticsResponse2 from '../components/plugin-wrapper/__fixtures__/analytics-response-2.json'
import eventVisualization1 from '../components/plugin-wrapper/__fixtures__/inpatient-cases-5-to-15-years-this-year.json'
import eventVisualization2 from '../components/plugin-wrapper/__fixtures__/inpatient-visit-overview-this-year-bonthe.json'
import DashboardPlugin from '../dashboard-plugin'

const visualization1Id = 'TIuOzZ0ID0V'
const visualization2Id = 'waPjzoJyIQ9'

/* `visualization` only ever needs an `id` here -- the plugin re-fetches the
 * full object itself (see dashboard-plugin.tsx's TODO about that prop being
 * typed as a full SavedVisualization when only an id is needed). */
const asSavedVisualization = (id: string) => ({ id }) as SavedVisualization

const mockOptions = {
    queryData: {
        /* Dimension strings are stage-prefixed (e.g.
         * "Zj7UnCAulEk.qrur9Dvnyt5:GE:5:LE:10"), so matching visualization 1's
         * request needs a substring check, not an exact-element `.includes`. */
        analytics: (_: unknown, query: { params: { dimension: string[] } }) =>
            query.params.dimension.some((dimension) =>
                dimension.includes('qrur9Dvnyt5:GE:5:LE:10')
            )
                ? analyticsResponse1
                : analyticsResponse2,
        dataStatistics: {},
        eventVisualizations: async (_: unknown, query: { id?: string }) => {
            if (query.id === visualization1Id) {
                return eventVisualization1
            } else if (query.id === visualization2Id) {
                return eventVisualization2
            }
        },
    } as unknown,
} as MockOptions

/* Wraps the real PluginWrapper so its isInDashboard prop is observable in
 * the DOM, without stubbing it out (the other tests in this file need it to
 * actually render the line list). */
vi.mock('@components/plugin-wrapper/plugin-wrapper', async (importOriginal) => {
    const actual = await importOriginal<typeof PluginWrapperModule>()
    const PluginWrapper = ({
        isInDashboard,
        ...rest
    }: ComponentProps<typeof actual.PluginWrapper>) => (
        <div
            data-test="plugin-wrapper-probe"
            data-is-in-dashboard={String(isInDashboard)}
        >
            <actual.PluginWrapper isInDashboard={isInDashboard} {...rest} />
        </div>
    )
    return { ...actual, PluginWrapper }
})

describe('DashboardPlugin', () => {
    it('fetches its own visualization from an id and renders it', async () => {
        await renderWithAppWrapper(
            <DashboardPlugin
                displayProperty="name"
                visualization={asSavedVisualization(visualization1Id)}
            />,
            mockOptions
        )

        await waitFor(() => {
            expect(
                screen.getByTestId('line-list-data-table')
            ).toBeInTheDocument()
        })

        expect(screen.getByTestId('plugin-wrapper-probe')).toHaveAttribute(
            'data-is-in-dashboard',
            'true'
        )
    })

    it('accepts dashboard filters without failing to render', async () => {
        await renderWithAppWrapper(
            <DashboardPlugin
                displayProperty="name"
                visualization={asSavedVisualization(visualization1Id)}
                filters={{
                    ou: [{ id: 'ImspTQPwCqd', name: 'Sierra Leone' }],
                    pe: [{ id: 'LAST_12_MONTHS', name: 'Last 12 months' }],
                    yourDimensions: {
                        uIuxlbV1vRT: [
                            { id: 'J40PpdN4Wkk', name: 'Northern Area' },
                        ],
                    },
                }}
            />,
            mockOptions
        )

        /* ou/pe/yourDimensions are not applied by the plugin. This only pins
         * the contract that unknown host filter fields must not break
         * rendering. */
        await waitFor(() => {
            expect(
                screen.getByTestId('line-list-data-table')
            ).toBeInTheDocument()
        })
    })

    it('re-fetches and re-renders when given a different visualization id', async () => {
        const { rerender } = await renderWithAppWrapper(
            <DashboardPlugin
                displayProperty="name"
                visualization={asSavedVisualization(visualization1Id)}
            />,
            mockOptions
        )

        /* Column count, not column text: rendered header text goes through
         * metadata-store name resolution, which this test doesn't fully seed.
         * The two fixtures have a different number of analytics columns (7 vs
         * 11), which is a stable signal that doesn't depend on that
         * resolution. */
        await waitFor(() => {
            expect(screen.getAllByTestId('data-table-header')).toHaveLength(
                analyticsResponse1.headers.length
            )
        })

        rerender(
            <DashboardPlugin
                displayProperty="name"
                visualization={asSavedVisualization(visualization2Id)}
            />
        )

        /* This is the regression test for the stale-visualization bug: with
         * useDataQuery (which freezes its query on first render), this would
         * keep showing visualization 1's columns forever. */
        await waitFor(() => {
            expect(screen.getAllByTestId('data-table-header')).toHaveLength(
                analyticsResponse2.headers.length
            )
        })
    })
})
