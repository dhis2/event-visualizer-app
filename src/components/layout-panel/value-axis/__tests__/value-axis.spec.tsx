import {
    getVisUiConfigCustomValue,
    getVisUiConfigLayout,
    initialState,
    visUiConfigSlice,
    type CustomValueObject,
} from '@store/vis-ui-config-slice'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { ValueAxis } from '../value-axis'

const metadata = {
    weight: {
        id: 'weight',
        name: 'Weight in kg',
        dimensionType: 'PROGRAM_ATTRIBUTE',
        valueType: 'NUMBER',
    },
}

const renderValueAxis = async (
    customValue?: CustomValueObject,
    itemAggregationType = 'SUM'
) =>
    await renderWithAppWrapper(<ValueAxis />, {
        metadata,
        queryData: {
            trackedEntityAttributes: { aggregationType: itemAggregationType },
        },
        partialStore: {
            reducer: { visUiConfig: visUiConfigSlice.reducer },
            preloadedState: {
                visUiConfig: {
                    ...initialState,
                    visualizationType: 'PIVOT_TABLE',
                    layout: { columns: ['ou'], rows: [], filters: [] },
                    customValue,
                },
            },
        },
    })

describe('ValueAxis', () => {
    it('shows count when no cell value is set', async () => {
        await renderValueAxis()

        expect(screen.getByText('Count')).toBeInTheDocument()
        expect(screen.queryByTestId('value-chip')).not.toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Reset' })
        ).not.toBeInTheDocument()
    })

    it('explains how to change the cell value when hovering count', async () => {
        const user = userEvent.setup()
        await renderValueAxis()

        await user.hover(screen.getByText('Count'))

        expect(
            await screen.findByText(
                'Cells show a count. Drag or add a numeric data item here to change the cell value.'
            )
        ).toBeInTheDocument()
    })

    it('shows the cell value as a chip with its aggregation', async () => {
        await renderValueAxis({ id: 'weight', aggregationType: 'SUM' })

        expect(screen.getByTestId('value-chip')).toHaveTextContent(
            'Weight in kg'
        )
        expect(screen.getByTestId('chip-suffix')).toHaveTextContent('Sum')
        expect(screen.queryByText('Count')).not.toBeInTheDocument()
    })

    it('shows the aggregation the item default resolves to', async () => {
        await renderValueAxis(
            { id: 'weight', aggregationType: 'DEFAULT' },
            'AVERAGE'
        )

        expect(await screen.findByTestId('chip-suffix')).toHaveTextContent(
            'Average'
        )
        expect(screen.getByTestId('chip-suffix')).not.toHaveTextContent(
            'default'
        )
    })

    it('resets to count from the reset button', async () => {
        const user = userEvent.setup()
        const { store } = await renderValueAxis({
            id: 'weight',
            aggregationType: 'SUM',
        })

        await user.click(screen.getByRole('button', { name: 'Reset' }))

        expect(getVisUiConfigCustomValue(store.getState())).toBeUndefined()
        expect(screen.getByText('Count')).toBeInTheDocument()
    })

    it('moves the cell value to an axis from the chip menu', async () => {
        const user = userEvent.setup()
        const { store } = await renderValueAxis({
            id: 'weight',
            aggregationType: 'SUM',
        })

        await user.click(screen.getByTestId('value-chip-menu-button'))
        await user.click(screen.getByText('Move to Rows'))

        expect(getVisUiConfigCustomValue(store.getState())).toBeUndefined()
        expect(getVisUiConfigLayout(store.getState()).rows).toEqual(['weight'])
    })

    describe('aggregation mode in the chip menu', () => {
        const openAggregationSubmenu = async (
            user: ReturnType<typeof userEvent.setup>
        ) => {
            await user.click(screen.getByTestId('value-chip-menu-button'))
            await user.click(screen.getByText('Aggregation mode'))
        }

        it('changes the aggregation of the cell value', async () => {
            const user = userEvent.setup()
            const { store } = await renderValueAxis({
                id: 'weight',
                aggregationType: 'SUM',
            })

            await openAggregationSubmenu(user)
            await user.click(screen.getByText('Max'))

            expect(getVisUiConfigCustomValue(store.getState())).toEqual({
                id: 'weight',
                aggregationType: 'MAX',
            })
        })

        it('marks the current aggregation as checked', async () => {
            const user = userEvent.setup()
            await renderValueAxis({ id: 'weight', aggregationType: 'SUM' })

            await openAggregationSubmenu(user)

            expect(
                screen.getByRole('menuitemcheckbox', { name: 'Sum' })
            ).toHaveAttribute('aria-checked', 'true')
            expect(
                screen.getByRole('menuitemcheckbox', { name: 'Max' })
            ).toHaveAttribute('aria-checked', 'false')
        })

        it('names the item default aggregation', async () => {
            const user = userEvent.setup()
            await renderValueAxis({ id: 'weight', aggregationType: 'MAX' })

            await openAggregationSubmenu(user)

            expect(
                await screen.findByRole('menuitemcheckbox', {
                    name: 'Use item default (Sum)',
                })
            ).toBeInTheDocument()
        })

        it('does not offer the item default when it is NONE', async () => {
            const user = userEvent.setup()
            await renderValueAxis(
                { id: 'weight', aggregationType: 'AVERAGE' },
                'NONE'
            )

            await openAggregationSubmenu(user)

            await waitFor(() =>
                expect(
                    screen.getByRole('menuitemcheckbox', {
                        name: 'Use item default',
                    })
                ).toHaveAttribute('aria-disabled', 'true')
            )
        })
    })
})
