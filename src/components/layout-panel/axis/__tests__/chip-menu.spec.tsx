import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import { ChipMenu } from '@components/layout-panel/axis/chip-menu'
import { initialState as visUiConfigInitialState } from '@store/vis-ui-config-slice'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { fireEvent, screen } from '@testing-library/react'
import type { VisualizationType } from '@types'
import { describe, it, expect, vi } from 'vitest'

const numericDimension: LayoutDimension = {
    id: 'weight',
    dimensionId: 'weight',
    dimensionType: 'PROGRAM_ATTRIBUTE',
    name: 'Weight',
    valueType: 'NUMBER',
}

const textDimension: LayoutDimension = {
    ...numericDimension,
    id: 'firstName',
    dimensionId: 'firstName',
    name: 'First name',
    valueType: 'TEXT',
}

const renderChipMenu = ({
    dimension,
    visualizationType = 'PIVOT_TABLE',
    onClose = vi.fn(),
}: {
    dimension: LayoutDimension
    visualizationType?: VisualizationType
    onClose?: () => void
}) =>
    renderWithAppWrapper(
        <ChipMenu axisId="columns" dimension={dimension} onClose={onClose} />,
        {
            partialStore: {
                preloadedState: {
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType,
                        layout: {
                            columns: [dimension.id],
                            rows: [],
                            filters: [],
                        },
                    },
                },
            },
        }
    )

describe('ChipMenu', () => {
    it('uses a numeric chip as the value and keeps it on its axis', async () => {
        const onClose = vi.fn()
        const { store } = await renderChipMenu({
            dimension: numericDimension,
            onClose,
        })

        fireEvent.click(screen.getByText('Use as value'))

        const { customValue, layout } = store.getState().visUiConfig
        expect(customValue).toEqual({
            id: numericDimension.id,
            aggregationType: 'DEFAULT',
        })
        expect(layout.columns).toEqual([numericDimension.id])
        expect(onClose).toHaveBeenCalled()
    })

    it('does not offer a non-numeric chip as the value', async () => {
        await renderChipMenu({ dimension: textDimension })

        expect(screen.getByText('Move to Filter')).toBeInTheDocument()
        expect(screen.queryByText('Use as value')).not.toBeInTheDocument()
    })

    it('does not offer a value in a line list', async () => {
        await renderChipMenu({
            dimension: numericDimension,
            visualizationType: 'LINE_LIST',
        })

        expect(screen.getByText('Move to Filter')).toBeInTheDocument()
        expect(screen.queryByText('Use as value')).not.toBeInTheDocument()
    })
})
