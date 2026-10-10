import {
    getVisUiConfigCellValue,
    initialState as visUiConfigInitialState,
} from '@store/vis-ui-config-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RootState, VisualizationType } from '@types'
import { describe, it, expect, vi } from 'vitest'
import type { LayoutDimension } from '../chip'
import { ChipMenu } from '../chip-menu'

const numericDimension: LayoutDimension = {
    id: 's1.de1',
    dimensionId: 'de1',
    dimensionType: 'DATA_ELEMENT',
    name: 'Weight in kg',
    valueType: 'NUMBER',
}

const textDimension: LayoutDimension = {
    id: 's1.de2',
    dimensionId: 'de2',
    dimensionType: 'DATA_ELEMENT',
    name: 'Comment',
    valueType: 'TEXT',
}

const stage1 = {
    id: 's1',
    name: 'Stage 1',
    repeatable: false,
    hideDueDate: false,
    program: { id: 'p1' },
}

const metadata = {
    p1: {
        id: 'p1',
        name: 'Program 1',
        programType: 'WITHOUT_REGISTRATION',
        programStages: [stage1],
    },
    s1: stage1,
    's1.de1': {
        id: 's1.de1',
        name: 'Weight in kg',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
        aggregationType: 'SUM',
    },
    's1.de2': {
        id: 's1.de2',
        name: 'Comment',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'TEXT',
    },
}

const buildMockOptions = (
    visualizationType: VisualizationType = 'PIVOT_TABLE'
): MockOptions => ({
    metadata,
    partialStore: {
        preloadedState: {
            visUiConfig: {
                ...visUiConfigInitialState,
                visualizationType,
                layout: {
                    ...visUiConfigInitialState.layout,
                    columns: ['s1.de1', 's1.de2'],
                },
            },
        } as Partial<RootState>,
    },
})

const useAsValueItem = (dimensionId: string) =>
    screen.queryByTestId(`chip-menu-item-use-as-value-${dimensionId}`)

describe('ChipMenu — Use as value', () => {
    it('offers the action for a numeric dimension in a pivot table', async () => {
        await renderWithAppWrapper(
            <ChipMenu
                axisId="columns"
                dimension={numericDimension}
                onClose={vi.fn()}
            />,
            buildMockOptions()
        )

        expect(useAsValueItem('s1.de1')).toBeInTheDocument()
    })

    it('does not offer it for a non-numeric dimension', async () => {
        await renderWithAppWrapper(
            <ChipMenu
                axisId="columns"
                dimension={textDimension}
                onClose={vi.fn()}
            />,
            buildMockOptions()
        )

        expect(useAsValueItem('s1.de2')).not.toBeInTheDocument()
    })

    it('does not offer it in a line list, which has no value axis', async () => {
        await renderWithAppWrapper(
            <ChipMenu
                axisId="columns"
                dimension={numericDimension}
                onClose={vi.fn()}
            />,
            buildMockOptions('LINE_LIST')
        )

        expect(useAsValueItem('s1.de1')).not.toBeInTheDocument()
    })

    it('places the action after the move actions', async () => {
        await renderWithAppWrapper(
            <ChipMenu
                axisId="columns"
                dimension={numericDimension}
                onClose={vi.fn()}
            />,
            buildMockOptions()
        )

        const moveItem = screen.getByTestId(
            'chip-menu-item-move-s1.de1-to-rows'
        )
        const valueItem = screen.getByTestId(
            'chip-menu-item-use-as-value-s1.de1'
        )

        expect(
            moveItem.compareDocumentPosition(valueItem) &
                Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy()
    })

    /* A clone: the dimension keeps its place in the layout. */
    it('sets the cell value and leaves the layout untouched', async () => {
        const onClose = vi.fn()
        const user = userEvent.setup()
        const { store } = await renderWithAppWrapper(
            <ChipMenu
                axisId="columns"
                dimension={numericDimension}
                onClose={onClose}
            />,
            buildMockOptions()
        )

        await user.click(screen.getByRole('menuitem', { name: 'Use as value' }))

        expect(getVisUiConfigCellValue(store.getState())).toEqual({
            id: 's1.de1',
            aggregationType: 'DEFAULT',
        })
        expect(store.getState().visUiConfig.layout.columns).toEqual([
            's1.de1',
            's1.de2',
        ])
        expect(onClose).toHaveBeenCalled()
    })

    /* A dimension already in the layout reaches the value axis through this
     * menu: the dimension modal shows Update rather than the Add to… split
     * button once it is in use. */
    it('offers the action for a chip in the filters axis', async () => {
        const user = userEvent.setup()
        const { store } = await renderWithAppWrapper(
            <ChipMenu
                axisId="filters"
                dimension={numericDimension}
                onClose={vi.fn()}
            />,
            buildMockOptions()
        )

        await user.click(screen.getByRole('menuitem', { name: 'Use as value' }))

        expect(getVisUiConfigCellValue(store.getState())).toEqual({
            id: 's1.de1',
            aggregationType: 'DEFAULT',
        })
    })
})
