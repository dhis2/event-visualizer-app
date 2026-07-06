import { UpdateButton } from '@components/shared/update-button'
import { visTypeDisplayNames } from '@dhis2/analytics'
import { currentVisSlice } from '@store/current-vis-slice'
import {
    initialState as visUiConfigInitialState,
    visUiConfigSlice,
} from '@store/vis-ui-config-slice'
import { renderWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RootState, VisualizationType } from '@types'
import { describe, it, expect, vi } from 'vitest'

const setupTestStore = (
    currentVis: RootState['currentVis'],
    visualizationType: VisualizationType = 'PIVOT_TABLE'
) =>
    setupStore(
        {
            [currentVisSlice.name]: currentVisSlice.reducer,
            [visUiConfigSlice.name]: visUiConfigSlice.reducer,
        },
        {
            currentVis,
            visUiConfig: { ...visUiConfigInitialState, visualizationType },
        }
    )

const emptyVis: RootState['currentVis'] = {}
const populatedVis = { type: 'PIVOT_TABLE' } as RootState['currentVis']

describe('UpdateButton', () => {
    it('renders an enabled primary button that calls onClick when the visualization is populated', async () => {
        const user = userEvent.setup()
        const onClick = vi.fn()

        renderWithReduxStoreProvider(
            <UpdateButton onClick={onClick} />,
            setupTestStore(populatedVis)
        )

        const button = screen.getByRole('button', { name: 'Update' })
        expect(button).toBeEnabled()

        await user.click(button)
        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('disables the button and shows the create tooltip when the visualization is empty', async () => {
        const user = userEvent.setup()
        const onClick = vi.fn()

        renderWithReduxStoreProvider(
            <UpdateButton onClick={onClick} />,
            setupTestStore(emptyVis, 'PIVOT_TABLE')
        )

        const button = screen.getByRole('button', { name: 'Update' })
        expect(button).toBeDisabled()

        await user.hover(button)
        await expect(
            screen.findByText(
                `Create a ${visTypeDisplayNames['PIVOT_TABLE']} before updating`
            )
        ).resolves.toBeInTheDocument()

        await user.click(button)
        expect(onClick).not.toHaveBeenCalled()
    })

    it('names the visualization type in the tooltip', async () => {
        const user = userEvent.setup()

        renderWithReduxStoreProvider(
            <UpdateButton onClick={vi.fn()} />,
            setupTestStore(emptyVis, 'LINE_LIST')
        )

        await user.hover(screen.getByRole('button', { name: 'Update' }))
        await expect(
            screen.findByText(
                `Create a ${visTypeDisplayNames['LINE_LIST']} before updating`
            )
        ).resolves.toBeInTheDocument()
    })

    it('submits the associated form when used as a submit button', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn((e) => e.preventDefault())

        renderWithReduxStoreProvider(
            <form id="test-form" onSubmit={onSubmit}>
                <UpdateButton type="submit" form="test-form" />
            </form>,
            setupTestStore(populatedVis)
        )

        await user.click(screen.getByRole('button', { name: 'Update' }))
        expect(onSubmit).toHaveBeenCalledTimes(1)
    })
})
