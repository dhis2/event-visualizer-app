import { useMetadataStore } from '@components/app-wrapper/metadata-provider/metadata-provider'
import { getVisualizationTitle } from '@modules/visualization/title'
import { render, screen, waitFor } from '@testing-library/react'
import type { CurrentVisualization, DashboardPluginProps } from '@types'
import { useEffect, type FC } from 'react'
import { describe, it, expect, vi } from 'vitest'
import DashboardPlugin from '../dashboard-plugin'

const CELL_VALUE_ID = 'de1'

/* useDataQuery keeps returning the same data object until it refetches. */
const queryResult = vi.hoisted(() => ({
    loading: false,
    error: undefined,
    refetch: () => undefined,
    data: {
        eventVisualization: {
            id: 'vis1',
            name: 'Weight by gender',
            type: 'PIVOT_TABLE',
            outputType: 'EVENT',
            columns: [],
            rows: [],
            filters: [],
            programDimensions: [],
            metaData: {},
            aggregationType: 'DEFAULT',
            value: {
                id: 'de1',
                name: 'Weight',
                aggregationType: 'SUM',
                valueType: 'NUMBER',
                dimensionItemType: 'DATA_ELEMENT',
            },
        },
    },
}))

vi.mock('@dhis2/app-runtime', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    useDataQuery: () => queryResult,
}))

vi.mock('@dhis2/analytics', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    DashboardPluginWrapper: ({
        children,
    }: {
        children: (props: object) => unknown
    }) => children({ displayProperty: 'name' }),
}))

const cellValueItemsSeen = vi.hoisted(() => ({
    onRender: [] as unknown[],
    inEffect: [] as unknown[],
}))

/* Stands in for PluginWrapper, which reads the metadata store both while
 * rendering (the title) and in effects (the analytics request). */
vi.mock('@components/plugin-wrapper/plugin-wrapper', () => {
    const PluginWrapper: FC<{ visualization: CurrentVisualization }> = ({
        visualization,
    }) => {
        const metadataStore = useMetadataStore()
        const hasVisualization = Boolean(visualization.value)

        if (hasVisualization) {
            cellValueItemsSeen.onRender.push(
                metadataStore.getMetadataItem(CELL_VALUE_ID)
            )
        }

        useEffect(() => {
            if (hasVisualization) {
                cellValueItemsSeen.inEffect.push(
                    metadataStore.getMetadataItem(CELL_VALUE_ID)
                )
            }
        }, [hasVisualization, metadataStore])

        return hasVisualization ? (
            <h1>{getVisualizationTitle(visualization, metadataStore)}</h1>
        ) : null
    }
    return { PluginWrapper }
})

describe('DashboardPlugin', () => {
    const renderDashboardPlugin = () =>
        render(
            <DashboardPlugin
                {...({
                    visualizationId: 'vis1',
                    displayProperty: 'name',
                } as DashboardPluginProps)}
            />
        )

    it("registers the visualization's metadata before the plugin uses it", async () => {
        renderDashboardPlugin()

        await waitFor(() =>
            expect(cellValueItemsSeen.inEffect.length).toBeGreaterThan(0)
        )
        expect([
            ...cellValueItemsSeen.onRender,
            ...cellValueItemsSeen.inEffect,
        ]).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: CELL_VALUE_ID }),
            ])
        )
        expect([
            ...cellValueItemsSeen.onRender,
            ...cellValueItemsSeen.inEffect,
        ]).not.toContain(undefined)
    })

    it('renders the title of a pivot table with a cell value', async () => {
        renderDashboardPlugin()

        expect((await screen.findByRole('heading')).textContent).toBe(
            'Weight · Sum'
        )
    })
})
