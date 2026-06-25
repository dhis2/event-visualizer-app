import { getUiActiveDimensionModal, uiSlice } from '@store/ui-slice'
import {
    visUiConfigSlice,
    initialState as visUiConfigInitialState,
    type ConditionsObject,
} from '@store/vis-ui-config-slice'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { Chip, type LayoutDimension } from '../chip'

const numericDimension: LayoutDimension = {
    id: 'numdim',
    dimensionId: 'numdim',
    dimensionType: 'DATA_ELEMENT',
    name: 'Weight',
    valueType: 'NUMBER',
}

const renderChip = (conditions?: ConditionsObject) =>
    renderWithAppWrapper(
        <Chip dimension={numericDimension} axisId="columns" />,
        {
            partialStore: {
                reducer: {
                    visUiConfig: visUiConfigSlice.reducer,
                    ui: uiSlice.reducer,
                },
                preloadedState: {
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        conditionsByDimension: conditions
                            ? { numdim: conditions }
                            : {},
                    },
                },
            },
        }
    )

describe('Chip — grouped-into-ranges icon', () => {
    it('shows the icon when the dimension is grouped into ranges', async () => {
        await renderChip({ legendSet: 'ls1' })

        const icon = screen.getByTestId('layout-chip-grouped-icon')
        expect(icon).toBeInTheDocument()
        expect(icon).toHaveAccessibleName('Grouped')
    })

    it('still shows the icon when grouped and band-filtered', async () => {
        await renderChip({ legendSet: 'ls1', condition: 'IN:b1;b2' })

        expect(
            screen.getByTestId('layout-chip-grouped-icon')
        ).toBeInTheDocument()
    })

    it('opens the dimension modal when the icon is clicked', async () => {
        const user = userEvent.setup()
        const { store } = await renderChip({ legendSet: 'ls1' })

        await user.click(screen.getByTestId('layout-chip-grouped-icon'))

        expect(getUiActiveDimensionModal(store.getState())).toBe('numdim')
    })

    it('hides the icon for an exact dimension with no filter', async () => {
        await renderChip()

        expect(
            screen.queryByTestId('layout-chip-grouped-icon')
        ).not.toBeInTheDocument()
    })

    it('hides the icon for an exact dimension with an operator filter', async () => {
        await renderChip({ condition: 'GT:5' })

        expect(
            screen.queryByTestId('layout-chip-grouped-icon')
        ).not.toBeInTheDocument()
    })
})
