import { Title } from '@components/options/fields/title'
import {
    initialState as visUiConfigInitialState,
    visUiConfigSlice,
} from '@store/vis-ui-config-slice'
import { renderWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { EventVisualizationOptions } from '@types'
import { describe, expect, it } from 'vitest'

const setupTestStore = (options: Partial<EventVisualizationOptions> = {}) =>
    setupStore(
        { [visUiConfigSlice.name]: visUiConfigSlice.reducer },
        {
            visUiConfig: {
                ...visUiConfigInitialState,
                options: { ...visUiConfigInitialState.options, ...options },
            },
        }
    )

const renderTitle = (options: Partial<EventVisualizationOptions> = {}) => {
    const store = setupTestStore(options)
    renderWithReduxStoreProvider(<Title label="Table title" />, store)
    return { store }
}

describe('Title', () => {
    it('selects Auto generated when there is no title', () => {
        renderTitle()

        expect(screen.getByLabelText('Auto generated')).toBeChecked()
        expect(screen.queryByPlaceholderText('Add a title')).toBeNull()
    })

    it('selects Custom and shows the title when one is set', () => {
        renderTitle({ title: 'Saved title' })

        expect(screen.getByLabelText('Custom')).toBeChecked()
        expect(screen.getByPlaceholderText('Add a title')).toHaveValue(
            'Saved title'
        )
    })

    it('selects None when the title is hidden', () => {
        renderTitle({ hideTitle: true })

        expect(screen.getByLabelText('None')).toBeChecked()
    })

    it('shows the text input only in Custom mode', async () => {
        const user = userEvent.setup()
        renderTitle()

        await user.click(screen.getByLabelText('Custom'))

        expect(screen.getByPlaceholderText('Add a title')).toBeInTheDocument()
    })

    it('stores the typed title and clears the hidden flag', async () => {
        const user = userEvent.setup()
        const { store } = renderTitle()

        await user.click(screen.getByLabelText('Custom'))
        await user.type(screen.getByPlaceholderText('Add a title'), 'Mine')

        expect(store.getState().visUiConfig.options.title).toBe('Mine')
        expect(store.getState().visUiConfig.options.hideTitle).toBe(false)
    })

    it('clears the stored title when switching to Auto generated', async () => {
        const user = userEvent.setup()
        const { store } = renderTitle({ title: 'Saved title' })

        await user.click(screen.getByLabelText('Auto generated'))

        expect(store.getState().visUiConfig.options.title).toBe('')
        expect(store.getState().visUiConfig.options.hideTitle).toBe(false)
    })

    it('hides the title when switching to None', async () => {
        const user = userEvent.setup()
        const { store } = renderTitle({ title: 'Saved title' })

        await user.click(screen.getByLabelText('None'))

        expect(store.getState().visUiConfig.options.hideTitle).toBe(true)
    })

    it('keeps the typed title when toggling away and back', async () => {
        const user = userEvent.setup()
        renderTitle()

        await user.click(screen.getByLabelText('Custom'))
        await user.type(screen.getByPlaceholderText('Add a title'), 'Mine')
        await user.click(screen.getByLabelText('Auto generated'))
        await user.click(screen.getByLabelText('Custom'))

        expect(screen.getByPlaceholderText('Add a title')).toHaveValue('Mine')
    })

    it('leaves an empty Custom input stored as Auto generated', async () => {
        const user = userEvent.setup()
        const { store } = renderTitle()

        await user.click(screen.getByLabelText('Custom'))

        expect(store.getState().visUiConfig.options.title).toBe('')
        expect(store.getState().visUiConfig.options.hideTitle).toBe(false)
    })
})
