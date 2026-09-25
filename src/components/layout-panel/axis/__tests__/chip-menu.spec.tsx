import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import { ChipMenu } from '@components/layout-panel/axis/chip-menu'
import {
    getVisUiConfigCustomValue,
    getVisUiConfigLayout,
    initialState,
    visUiConfigSlice,
} from '@store/vis-ui-config-slice'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { VisualizationType } from '@types'
import { describe, it, expect, vi } from 'vitest'

const numericDimension: LayoutDimension = {
    id: 'weight',
    dimensionId: 'weight',
    name: 'Weight in kg',
    dimensionType: 'PROGRAM_ATTRIBUTE',
    valueType: 'NUMBER',
}

const textDimension: LayoutDimension = {
    ...numericDimension,
    id: 'name',
    dimensionId: 'name',
    name: 'Name',
    valueType: 'TEXT',
}

const renderChipMenu = async (
    dimension: LayoutDimension,
    visualizationType: VisualizationType = 'PIVOT_TABLE'
) =>
    await renderWithAppWrapper(
        <ChipMenu dimension={dimension} axisId="rows" onClose={vi.fn()} />,
        {
            metadata: { [dimension.id]: dimension },
            queryData: { trackedEntityAttributes: { aggregationType: 'SUM' } },
            partialStore: {
                reducer: { visUiConfig: visUiConfigSlice.reducer },
                preloadedState: {
                    visUiConfig: {
                        ...initialState,
                        visualizationType,
                        layout: {
                            columns: [],
                            rows: [dimension.id],
                            filters: [],
                        },
                    },
                },
            },
        }
    )

describe('ChipMenu — Move to Value', () => {
    it('moves a numeric dimension to the value axis', async () => {
        const user = userEvent.setup()
        const { store } = await renderChipMenu(numericDimension)

        await user.click(screen.getByText('Move to Value'))

        await waitFor(() =>
            expect(getVisUiConfigCustomValue(store.getState())?.id).toBe(
                'weight'
            )
        )
        expect(getVisUiConfigLayout(store.getState()).rows).toEqual([])
    })

    it('is not offered for a dimension that cannot be aggregated', async () => {
        await renderChipMenu(textDimension)

        expect(screen.queryByText('Move to Value')).not.toBeInTheDocument()
    })

    it('is not offered in a line list', async () => {
        await renderChipMenu(numericDimension, 'LINE_LIST')

        expect(screen.queryByText('Move to Value')).not.toBeInTheDocument()
    })
})
