import { AddToLayoutButton } from '@components/dimension-modal/add-to-layout-button'
import { initialState as uiInitialState } from '@store/ui-slice'
import { initialState as visUiConfigInitialState } from '@store/vis-ui-config-slice'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { fireEvent, screen } from '@testing-library/react'
import type { DimensionMetadataItem, VisualizationType } from '@types'
import { describe, it, expect, vi } from 'vitest'

const numericAttribute: DimensionMetadataItem = {
    id: 'weight',
    dimensionId: 'weight',
    dimensionType: 'PROGRAM_ATTRIBUTE',
    name: 'Weight',
    valueType: 'NUMBER',
}

const textAttribute: DimensionMetadataItem = {
    ...numericAttribute,
    id: 'firstName',
    dimensionId: 'firstName',
    name: 'First name',
    valueType: 'TEXT',
}

const renderButton = ({
    dimension,
    visualizationType = 'PIVOT_TABLE',
    onClick = vi.fn(),
}: {
    dimension: DimensionMetadataItem
    visualizationType?: VisualizationType
    onClick?: () => void
}) =>
    renderWithAppWrapper(<AddToLayoutButton onClick={onClick} />, {
        metadata: { [dimension.id]: dimension },
        partialStore: {
            preloadedState: {
                ui: { ...uiInitialState, activeDimensionModal: dimension.id },
                visUiConfig: { ...visUiConfigInitialState, visualizationType },
            },
        },
    })

const openFlyoutMenu = () =>
    fireEvent.click(screen.getByTestId('add-to-layout-button-toggle'))

describe('AddToLayoutButton', () => {
    it('sets a numeric item as the value without adding it to the layout', async () => {
        const onClick = vi.fn()
        const { store } = await renderButton({
            dimension: numericAttribute,
            onClick,
        })

        openFlyoutMenu()
        fireEvent.click(await screen.findByText('Use as value'))

        const { customValue, layout } = store.getState().visUiConfig
        expect(customValue).toEqual({
            id: numericAttribute.id,
            aggregationType: 'DEFAULT',
        })
        expect([
            ...layout.columns,
            ...layout.rows,
            ...layout.filters,
        ]).not.toContain(numericAttribute.id)
        expect(onClick).toHaveBeenCalled()
    })

    it('does not offer a non-numeric item as the value', async () => {
        await renderButton({ dimension: textAttribute })

        openFlyoutMenu()

        expect(await screen.findByText('Add to Filter')).toBeInTheDocument()
        expect(screen.queryByText('Use as value')).not.toBeInTheDocument()
    })

    it('does not offer a value in a line list', async () => {
        await renderButton({
            dimension: numericAttribute,
            visualizationType: 'LINE_LIST',
        })

        openFlyoutMenu()

        expect(await screen.findByText('Add to Filter')).toBeInTheDocument()
        expect(screen.queryByText('Use as value')).not.toBeInTheDocument()
    })
})
