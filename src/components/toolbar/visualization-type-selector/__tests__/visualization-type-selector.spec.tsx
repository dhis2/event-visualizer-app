import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RootState } from '@types'
import React from 'react'
import { describe, it, beforeEach } from 'vitest'
import { uiReducer, setUiState } from '../../../../store/ui-slice'
import type { UiState } from '../../../../store/ui-slice'
import {
    setupStore,
    renderWithReduxStoreProvider,
} from '../../../../test-utils'
import { VisualizationTypeSelector } from '../visualization-type-selector'

vi.mock('@dhis2/app-runtime', () => ({
    useConfig: jest.fn(() => ({ serverVersion: { minor: 43 } })),
}))

const initialUiState: UiState = {
    visualizationType: 'LINE_LIST',
}

describe('VisualizationTypeSelector', () => {
    let store: ReturnType<typeof setupStore> & {
        getState: () => Partial<RootState>
    }

    beforeEach(() => {
        if (!store) {
            store = setupStore({ ui: uiReducer }, { ui: initialUiState })
        } else {
            store.dispatch(setUiState(initialUiState))
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
