import {
    visUiConfigSlice,
    initialState,
    getVisUiConfigRepetitionsByDimension,
    type RepetitionsObject,
} from '@store/vis-ui-config-slice'
import { renderWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { RepeatedEventsTabContent } from '../repeated-events-tab-content'

const DIMENSION_ID = 'de1'

const setup = (
    repetitionsByDimension: Record<string, RepetitionsObject | undefined> = {}
) => {
    const store = setupStore(
        { visUiConfig: visUiConfigSlice.reducer },
        { visUiConfig: { ...initialState, repetitionsByDimension } }
    )

    renderWithReduxStoreProvider(
        <RepeatedEventsTabContent dimensionId={DIMENSION_ID} />,
        store
    )

    return store
}

const repetitions = (store: ReturnType<typeof setup>) =>
    getVisUiConfigRepetitionsByDimension(store.getState(), DIMENSION_ID)

const value = (key: 'oldest' | 'most-recent') =>
    screen.getByTestId(`${key}-value`).textContent

describe('RepeatedEventsTabContent', () => {
    it('shows the default values (1 most recent, 0 oldest) when nothing is persisted', () => {
        setup()

        expect(value('oldest')).toBe('0')
        expect(value('most-recent')).toBe('1')
    })

    it('increments the "oldest" count', async () => {
        const user = userEvent.setup()
        const store = setup()

        await user.click(screen.getByTestId('oldest-increment'))

        expect(repetitions(store)).toEqual({ mostRecent: 1, oldest: 1 })
    })

    it('increments the "most recent" count', async () => {
        const user = userEvent.setup()
        const store = setup()

        await user.click(screen.getByTestId('most-recent-increment'))

        expect(repetitions(store)).toEqual({ mostRecent: 2, oldest: 0 })
    })

    it('decrements a count back down', async () => {
        const user = userEvent.setup()
        const store = setup({ [DIMENSION_ID]: { mostRecent: 0, oldest: 3 } })

        await user.click(screen.getByTestId('oldest-decrement'))

        expect(repetitions(store)).toEqual({ mostRecent: 0, oldest: 2 })
    })

    it('disables "oldest" decrement when it would drop the total below 1', () => {
        setup({ [DIMENSION_ID]: { mostRecent: 0, oldest: 1 } })

        expect(screen.getByTestId('oldest-decrement')).toBeDisabled()
    })

    it('disables "most recent" decrement when it would drop the total below 1', () => {
        setup()

        expect(screen.getByTestId('most-recent-decrement')).toBeDisabled()
    })

    it('exposes each stepper as a group labelled by its heading', () => {
        setup()

        expect(
            screen.getByRole('group', { name: 'Oldest events' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('group', { name: 'Most recent events' })
        ).toBeInTheDocument()
    })

    it('marks a card active only when its count is above 0', () => {
        setup({ [DIMENSION_ID]: { mostRecent: 2, oldest: 0 } })

        expect(screen.getByTestId('oldest-card')).toHaveAttribute(
            'data-active',
            'false'
        )
        expect(screen.getByTestId('most-recent-card')).toHaveAttribute(
            'data-active',
            'true'
        )
    })

    it('removes the repetition config when the selection returns to the default', async () => {
        const user = userEvent.setup()
        const store = setup({ [DIMENSION_ID]: { mostRecent: 2, oldest: 0 } })

        await user.click(screen.getByTestId('most-recent-decrement'))

        expect(
            store.getState().visUiConfig.repetitionsByDimension[DIMENSION_ID]
        ).toBeUndefined()
        expect(value('most-recent')).toBe('1')
    })
})
