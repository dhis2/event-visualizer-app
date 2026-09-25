import { ValueAxis } from '@components/layout-panel/value-axis'
import { initialState as dimensionSelectionInitialState } from '@store/dimensions-selection-slice'
import {
    initialState as visUiConfigInitialState,
    type CustomValueObject,
} from '@store/vis-ui-config-slice'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, describe, it, expect, vi } from 'vitest'

const apgar = {
    id: 'apgar',
    dimensionId: 'apgar',
    dimensionType: 'PROGRAM_ATTRIBUTE' as const,
    name: 'APGAR score',
    valueType: 'NUMBER' as const,
}

const fetchAverage = async () => ({ aggregationType: 'AVERAGE' })

const renderValueAxis = (
    customValue?: CustomValueObject,
    fetchItemAggregationType: typeof fetchAverage = fetchAverage
) =>
    renderWithAppWrapper(<ValueAxis />, {
        metadata: { [apgar.id]: apgar },
        queryData: { trackedEntityAttributes: fetchItemAggregationType },
        partialStore: {
            preloadedState: {
                dimensionSelection: {
                    ...dimensionSelectionInitialState,
                    dataSourceId: 'prog1',
                },
                visUiConfig: {
                    ...visUiConfigInitialState,
                    visualizationType: 'PIVOT_TABLE',
                    customValue,
                },
            },
        },
    })

describe('ValueAxis', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('shows Count when no value is set', async () => {
        await renderValueAxis()

        expect(screen.getByText('Count')).toBeInTheDocument()
        expect(
            screen.queryByTestId('value-reset-button')
        ).not.toBeInTheDocument()
    })

    it('explains the count after hovering it for a moment', async () => {
        await renderValueAxis()
        /* Switched on after rendering: the wrapper waits for the store with
         * real timers. */
        vi.useFakeTimers()

        fireEvent.mouseOver(screen.getByText('Count'))
        await act(() => vi.advanceTimersByTimeAsync(700))
        expect(
            screen.queryByTestId('value-count-tooltip-content')
        ).not.toBeInTheDocument()

        await act(() => vi.advanceTimersByTimeAsync(100))
        expect(
            screen.getByTestId('value-count-tooltip-content')
        ).toHaveTextContent(
            'Cells show a count. Drag a numeric data item here to show its value.'
        )
    })

    it("shows a loading placeholder until the item's own aggregation type arrives", async () => {
        let respond: () => void = () => {}
        const pendingResponse = new Promise<void>((resolve) => {
            respond = resolve
        }).then(fetchAverage)

        await renderValueAxis(
            { id: apgar.id, aggregationType: 'DEFAULT' },
            () => pendingResponse
        )

        const button = screen.getByRole('button', {
            name: 'Change aggregation type',
        })
        expect(
            within(button).getByTestId('value-aggregation-loading')
        ).toBeInTheDocument()
        expect(button).not.toHaveTextContent('Default')

        respond()

        expect(await within(button).findByText('Average')).toBeInTheDocument()
        expect(
            within(button).queryByTestId('value-aggregation-loading')
        ).not.toBeInTheDocument()
    })

    it("names the item's own aggregation type when the value uses the default", async () => {
        await renderValueAxis({ id: apgar.id, aggregationType: 'DEFAULT' })

        expect(screen.getByText('APGAR score')).toBeInTheDocument()
        expect(
            await screen.findByRole('button', {
                name: 'Change aggregation type',
            })
        ).toHaveTextContent('Average')
    })

    it('names an explicitly chosen aggregation type', async () => {
        await renderValueAxis({ id: apgar.id, aggregationType: 'MAX' })

        expect(
            screen.getByRole('button', { name: 'Change aggregation type' })
        ).toHaveTextContent('Max')
    })

    it('changes the aggregation type from the menu', async () => {
        const { store } = await renderValueAxis({
            id: apgar.id,
            aggregationType: 'DEFAULT',
        })

        fireEvent.click(
            screen.getByRole('button', { name: 'Change aggregation type' })
        )
        fireEvent.click(await screen.findByText('Sum'))

        expect(store.getState().visUiConfig.customValue).toEqual({
            id: apgar.id,
            aggregationType: 'SUM',
        })
        expect(
            screen.getByRole('button', { name: 'Change aggregation type' })
        ).toHaveTextContent('Sum')
    })

    it('offers the item default by the aggregation type it resolves to', async () => {
        await renderValueAxis({ id: apgar.id, aggregationType: 'MAX' })

        fireEvent.click(
            screen.getByRole('button', { name: 'Change aggregation type' })
        )

        expect(
            await screen.findByText('Use item default (Average)')
        ).toBeInTheDocument()
        expect(screen.queryByText('Custom')).not.toBeInTheDocument()
    })

    it('resets the value back to Count', async () => {
        const { store } = await renderValueAxis({
            id: apgar.id,
            aggregationType: 'SUM',
        })

        fireEvent.click(screen.getByRole('button', { name: 'Reset to count' }))

        expect(store.getState().visUiConfig.customValue).toBeUndefined()
        expect(screen.getByText('Count')).toBeInTheDocument()
    })
})
