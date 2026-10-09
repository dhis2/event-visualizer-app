import { MockMetadataProvider } from '@components/app-wrapper/metadata-provider/metadata-provider'
import { PivotTablePlugin } from '@components/plugin-wrapper/pivot-table-plugin'
import { render, screen } from '@testing-library/react'
import type { CurrentVisualization } from '@types'
import { describe, expect, it, vi } from 'vitest'

/* The engine renders the filter row itself, so the only thing this app
 * controls is the prop. Stubbing the table keeps the assertion on that. */
vi.mock('@dhis2/analytics', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    PivotTable: ({ filterText }: { filterText?: string }) => (
        <div data-test="pivot-table" data-filter-text={filterText} />
    ),
}))

vi.mock(
    '@components/plugin-wrapper/hooks/use-pivot-table-analytics-data',
    () => ({
        usePivotTableAnalyticsData: () => [
            vi.fn(),
            {
                isFetching: false,
                data: { headers: [], rows: [], metaData: {} },
            },
        ],
    })
)

const visualization = {
    type: 'PIVOT_TABLE',
    outputType: 'EVENT',
    columns: [],
    rows: [],
    filters: [],
} as unknown as CurrentVisualization

describe('PivotTablePlugin', () => {
    it('hands the filter text to the pivot table', () => {
        render(
            <MockMetadataProvider>
                <PivotTablePlugin
                    displayProperty="name"
                    visualization={visualization}
                    isInDashboard={false}
                    isInModal={false}
                    onResponseReceived={vi.fn()}
                    filterText="Gender: Female"
                />
            </MockMetadataProvider>
        )

        expect(screen.getByTestId('pivot-table')).toHaveAttribute(
            'data-filter-text',
            'Gender: Female'
        )
    })

    it('passes no filter text when there is none', () => {
        render(
            <MockMetadataProvider>
                <PivotTablePlugin
                    displayProperty="name"
                    visualization={visualization}
                    isInDashboard={false}
                    isInModal={false}
                    onResponseReceived={vi.fn()}
                />
            </MockMetadataProvider>
        )

        expect(screen.getByTestId('pivot-table')).not.toHaveAttribute(
            'data-filter-text'
        )
    })
})
