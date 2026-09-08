import { Limit } from '@components/options/fields/limit'
import { DEFAULT_OPTIONS } from '@constants/options'
import {
    initialState as visUiConfigInitialState,
    visUiConfigSlice,
} from '@store/vis-ui-config-slice'
import { renderWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FormEvent } from 'react'
import { describe, it, expect, vi } from 'vitest'

const setupTestStore = () =>
    setupStore(
        { [visUiConfigSlice.name]: visUiConfigSlice.reducer },
        {
            visUiConfig: {
                ...visUiConfigInitialState,
                visualizationType: 'PIVOT_TABLE',
                options: { ...DEFAULT_OPTIONS, sortOrder: -1, topLimit: 10 },
            },
        }
    )

const getTopLimitInput = () => screen.getByLabelText('Top limit')

const getStoredTopLimit = (store: ReturnType<typeof setupTestStore>) =>
    store.getState().visUiConfig.options.topLimit

const VALIDATION_TEXT = 'Enter a whole number of 1 or higher'

const renderLimitInForm = (
    store: ReturnType<typeof setupTestStore>,
    onSubmit: (event: FormEvent<HTMLFormElement>) => void
) =>
    renderWithReduxStoreProvider(
        <form onSubmit={onSubmit}>
            <Limit />
            <button type="submit">Update</button>
        </form>,
        store
    )

const replaceTopLimit = async (
    user: ReturnType<typeof userEvent.setup>,
    value: string
) => {
    await user.clear(getTopLimitInput())

    if (value) {
        await user.type(getTopLimitInput(), value)
    }
}

const REJECTED_VALUES = ['0', '-5', '1.5', '']

describe('Limit', () => {
    it('propagates an accepted limit to the store as it is typed', async () => {
        const user = userEvent.setup()
        const store = setupTestStore()

        renderWithReduxStoreProvider(<Limit />, store)

        await replaceTopLimit(user, '25')

        expect(getStoredTopLimit(store)).toBe(25)
    })

    it.each(REJECTED_VALUES)('reports "%s" as invalid', async (value) => {
        const user = userEvent.setup()
        const store = setupTestStore()

        renderWithReduxStoreProvider(<Limit />, store)

        await replaceTopLimit(user, value)

        expect(screen.getByText(VALIDATION_TEXT)).toBeInTheDocument()
    })

    it.each(['0', '-5'])(
        'keeps the limit %s out of the store',
        async (value) => {
            const user = userEvent.setup()
            const store = setupTestStore()

            renderWithReduxStoreProvider(<Limit />, store)

            await replaceTopLimit(user, value)

            expect(getStoredTopLimit(store)).toBe(10)
        }
    )

    it.each(REJECTED_VALUES)(
        'undoes the edit on blur when it ends on "%s"',
        async (value) => {
            const user = userEvent.setup()
            const store = setupTestStore()

            renderWithReduxStoreProvider(<Limit />, store)

            await replaceTopLimit(user, value)
            await user.tab()

            expect(getTopLimitInput()).toHaveValue(10)
            expect(getStoredTopLimit(store)).toBe(10)
            expect(screen.queryByText(VALIDATION_TEXT)).not.toBeInTheDocument()
        }
    )

    it('undoes back to the previous settled limit, not the original one', async () => {
        const user = userEvent.setup()
        const store = setupTestStore()

        renderWithReduxStoreProvider(<Limit />, store)

        await replaceTopLimit(user, '25')
        await user.tab()
        await replaceTopLimit(user, '0')
        await user.tab()

        expect(getTopLimitInput()).toHaveValue(25)
        expect(getStoredTopLimit(store)).toBe(25)
    })

    it('submits the undone limit when an invalid edit is left by clicking Update', async () => {
        const user = userEvent.setup()
        const store = setupTestStore()
        const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) =>
            event.preventDefault()
        )

        renderLimitInForm(store, onSubmit)

        await replaceTopLimit(user, '0')
        await user.click(screen.getByRole('button', { name: 'Update' }))

        expect(onSubmit).toHaveBeenCalledOnce()
        expect(getStoredTopLimit(store)).toBe(10)
    })

    it('submits the accepted limit when a valid edit is left by clicking Update', async () => {
        const user = userEvent.setup()
        const store = setupTestStore()
        const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) =>
            event.preventDefault()
        )

        renderLimitInForm(store, onSubmit)

        await replaceTopLimit(user, '25')
        await user.click(screen.getByRole('button', { name: 'Update' }))

        expect(onSubmit).toHaveBeenCalledOnce()
        expect(getStoredTopLimit(store)).toBe(25)
    })

    it('refuses to submit with Enter while the value is invalid', async () => {
        const user = userEvent.setup()
        const store = setupTestStore()
        const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) =>
            event.preventDefault()
        )

        renderLimitInForm(store, onSubmit)

        await replaceTopLimit(user, '0')
        await user.type(getTopLimitInput(), '{Enter}')

        expect(onSubmit).not.toHaveBeenCalled()
        expect(getTopLimitInput()).toHaveValue(0)
        expect(screen.getByText(VALIDATION_TEXT)).toBeInTheDocument()
    })

    it('submits the accepted limit with Enter', async () => {
        const user = userEvent.setup()
        const store = setupTestStore()
        const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) =>
            event.preventDefault()
        )

        renderLimitInForm(store, onSubmit)

        await replaceTopLimit(user, '5')
        await user.type(getTopLimitInput(), '{Enter}')

        expect(onSubmit).toHaveBeenCalledOnce()
        expect(getStoredTopLimit(store)).toBe(5)
    })
})
