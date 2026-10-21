import { useMetadataStore } from '@components/app-wrapper/metadata-provider/metadata-provider'
import { DashboardItem } from '@components/dashboard-item/dashboard-item'
import { isVisualizationEmpty } from '@modules/visualization/guards'
import { getVisualizationTitle } from '@modules/visualization/title'
import { render, screen } from '@testing-library/react'
import type { CurrentVisualization, EmptyVisualization } from '@types'
import type { FC, ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

const pivotTableWithCellValue = {
    id: 'vis1',
    type: 'PIVOT_TABLE',
    outputType: 'EVENT',
    columns: [],
    rows: [],
    filters: [],
    metaData: {},
    aggregationType: 'AVERAGE',
    value: {
        id: 'de1',
        name: 'Weight',
        aggregationType: 'AVERAGE',
        valueType: 'NUMBER',
        dimensionItemType: 'DATA_ELEMENT',
    },
}

/* useDataQuery hands back the same data object until it refetches. */
const queryData = { eventVisualization: pivotTableWithCellValue }

vi.mock('@dhis2/app-runtime', async (importOriginal) => ({
    ...(await importOriginal()),
    useDataQuery: () => ({
        data: queryData,
        error: undefined,
        loading: false,
        refetch: vi.fn(),
    }),
}))

vi.mock('@dhis2/analytics', () => ({
    DashboardPluginWrapper: ({
        children,
    }: {
        children: (props: { displayProperty: string }) => ReactNode
    }) => children({ displayProperty: 'name' }),
}))

const cellValueMetadataSeenByPluginWrapper = vi.fn()

const PluginWrapperStub: FC<{
    visualization: CurrentVisualization | EmptyVisualization
}> = ({ visualization }) => {
    const metadataStore = useMetadataStore()

    if (isVisualizationEmpty(visualization)) {
        return null
    }

    cellValueMetadataSeenByPluginWrapper(metadataStore.getMetadataItem('de1'))

    return <h1>{getVisualizationTitle(visualization, metadataStore)}</h1>
}

vi.mock('@components/plugin-wrapper/plugin-wrapper', () => ({
    PluginWrapper: (props: {
        visualization: CurrentVisualization | EmptyVisualization
    }) => <PluginWrapperStub {...props} />,
}))

describe('DashboardItem', () => {
    it("registers the visualization's metadata before PluginWrapper renders it", () => {
        render(<DashboardItem displayProperty="name" visualizationId="vis1" />)

        expect(cellValueMetadataSeenByPluginWrapper).toHaveBeenCalled()
        for (const [metadataItem] of cellValueMetadataSeenByPluginWrapper.mock
            .calls) {
            expect(metadataItem).toMatchObject({ id: 'de1', name: 'Weight' })
        }
    })

    it('renders the title of a pivot table with a cell value', () => {
        render(<DashboardItem displayProperty="name" visualizationId="vis1" />)

        expect(screen.getByRole('heading').textContent).toBe('Weight · Average')
    })
})
