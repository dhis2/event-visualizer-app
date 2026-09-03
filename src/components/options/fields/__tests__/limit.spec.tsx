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

const INVALID_VALUES = ['0', '-5', '1.5']

describe('Limit', () => {
    it('stores an accepted top limit as a number once the edit ends', async () => {
        const user = userEvent.setup()
        const store = setupTestStore()

        renderWithReduxStoreProvider(<Limit />, store)

        await user.clear(getTopLimitInput())
        await user.type(getTopLimitInput(), '25')
        await user.tab()

        expect(getTopLimitInput()).toHaveValue(25)
        expect(getStoredTopLimit(store)).toBe(25)
    })

    it.each(INVALID_VALUES)(
        'reports %s as invalid and keeps it out of the store',
        async (value) => {
            const user = userEvent.setup()
            const store = setupTestStore()

            renderWithReduxStoreProvider(<Limit />, store)

            await user.clear(getTopLimitInput())
            await user.type(getTopLimitInput(), value)

            expect(getTopLimitInput()).toHaveValue(Number(value))
            expect(screen.getByText(VALIDATION_TEXT)).toBeInTheDocument()
            expect(getStoredTopLimit(store)).toBe(10)
        }
    )

    it('reports an emptied field as invalid and keeps the stored limit', async () => {
        const user = userEvent.setup()
        const store = setupTestStore()

        renderWithReduxStoreProvider(<Limit />, store)

        await user.clear(getTopLimitInput())

        expect(screen.getByText(VALIDATION_TEXT)).toBeInTheDocument()
        expect(getStoredTopLimit(store)).toBe(10)
    })

    it.each([...INVALID_VALUES, ''])(
        'restores the stored limit when "%s" is blurred',
        async (value) => {
            const user = userEvent.setup()
            const store = setupTestStore()

            renderWithReduxStoreProvider(<Limit />, store)

            await user.clear(getTopLimitInput())
            if (value) {
                await user.type(getTopLimitInput(), value)
            }
            await user.tab()

            expect(getTopLimitInput()).toHaveValue(10)
            expect(getStoredTopLimit(store)).toBe(10)
            expect(screen.queryByText(VALIDATION_TEXT)).not.toBeInTheDocument()
        }
    )

    it('submits the restored limit when an invalid value is left by clicking Update', async () => {
        const user = userEvent.setup()
        const store = setupTestStore()
        const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) =>
            event.preventDefault()
        )

        renderLimitInForm(store, onSubmit)

        await user.clear(getTopLimitInput())
        await user.type(getTopLimitInput(), '0')
        await user.click(screen.getByRole('button', { name: 'Update' }))

        expect(onSubmit).toHaveBeenCalledOnce()
        expect(getStoredTopLimit(store)).toBe(10)
    })

    it('submits the accepted limit when a valid value is left by clicking Update', async () => {
        const user = userEvent.setup()
        const store = setupTestStore()
        const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) =>
            event.preventDefault()
        )

        renderLimitInForm(store, onSubmit)

        await user.clear(getTopLimitInput())
        await user.type(getTopLimitInput(), '25')
        await user.click(screen.getByRole('button', { name: 'Update' }))

        expect(onSubmit).toHaveBeenCalledOnce()
        expect(getStoredTopLimit(store)).toBe(25)
    })

    it('blocks submitting with Enter while the value is invalid', async () => {
        const user = userEvent.setup()
        const store = setupTestStore()
        const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) =>
            event.preventDefault()
        )

        renderLimitInForm(store, onSubmit)

        await user.clear(getTopLimitInput())
        await user.type(getTopLimitInput(), '0{Enter}')

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

        await user.clear(getTopLimitInput())
        await user.type(getTopLimitInput(), '5{Enter}')

        expect(onSubmit).toHaveBeenCalledOnce()
        expect(getStoredTopLimit(store)).toBe(5)
    })
})
