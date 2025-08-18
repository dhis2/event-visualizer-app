import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, beforeEach } from 'vitest'
import { VisualizationTypeSelector } from '../visualization-type-selector'
import { uiSlice, initialState, setUiState } from '@store/ui-slice'
import { setupStore, renderWithReduxStoreProvider } from '@test-utils'
import type { RootState } from '@types'

vi.mock('@dhis2/app-runtime', () => ({
    useConfig: jest.fn(() => ({ serverVersion: { minor: 43 } })),
}))

describe('VisualizationTypeSelector', () => {
    let store: ReturnType<typeof setupStore> & {
        getState: () => Partial<RootState>
    }

    beforeEach(() => {
        if (!store) {
            store = setupStore({ ui: uiSlice.reducer }, { ui: initialState })
        } else {
            store.dispatch(setUiState(initialState))
        }
    })

    it('renders the Line list item by default', () => {
        renderWithReduxStoreProvider(<VisualizationTypeSelector />, store)

        expect(screen.getByText('Line list')).toBeInTheDocument()
    })

    it('opens the dropdown on click', async () => {
        const user = userEvent.setup()

        renderWithReduxStoreProvider(<VisualizationTypeSelector />, store)

        await user.click(
            screen.getByTestId('visualization-type-selector-button')
        )

        const modal = screen.getByTestId('visualization-type-selector-card')
        expect(modal).toBeInTheDocument()
        expect(within(modal).getByText('Line list')).toBeInTheDocument()
        expect(within(modal).getByText('Pivot table')).toBeInTheDocument()
    })

    it('')
})
