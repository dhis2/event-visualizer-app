import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { BandFilter } from '../band-filter'

const legendSetFixture = {
    id: 'ls1',
    name: 'Age intervals',
    legends: [
        {
            id: 'high',
            name: 'High',
            startValue: 20,
            endValue: 30,
            color: '#abcdef',
        },
        {
            id: 'low',
            name: 'Low',
            startValue: 0,
            endValue: 10,
            color: '#fedcba',
        },
        {
            id: 'mid',
            name: 'Mid',
            startValue: 10,
            endValue: 20,
            color: '#abc123',
        },
    ],
}

const setup = async (condition: string) => {
    const onChange = vi.fn()
    const view = await renderWithAppWrapper(
        <BandFilter
            legendSetId="ls1"
            condition={condition}
            onChange={onChange}
        />,
        { queryData: { legendSets: legendSetFixture } }
    )
    return { onChange, ...view }
}

const sourceContainer = () =>
    screen.getByTestId('band-filter-transfer-sourceoptions')
const pickedContainer = () =>
    screen.getByTestId('band-filter-transfer-pickedoptions')

const optionValuesIn = (container: HTMLElement) =>
    within(container)
        .queryAllByTestId('band-filter-option')
        .map((el) => el.getAttribute('data-value'))

describe('BandFilter', () => {
    it('lists source bands sorted by startValue regardless of API order', async () => {
        await setup('')

        await waitFor(() =>
            expect(optionValuesIn(sourceContainer())).toHaveLength(3)
        )

        expect(optionValuesIn(sourceContainer())).toEqual([
            'low',
            'mid',
            'high',
        ])
    })

    it('preserves the picked order from the condition', async () => {
        await setup('IN:high;low')

        await waitFor(() =>
            expect(optionValuesIn(pickedContainer())).toHaveLength(2)
        )

        expect(optionValuesIn(pickedContainer())).toEqual(['high', 'low'])
        expect(optionValuesIn(sourceContainer())).toEqual(['mid'])
    })

    it('emits an IN: condition joined in picked order when a band is added', async () => {
        const user = userEvent.setup()
        const { onChange } = await setup('IN:low')

        await waitFor(() =>
            expect(within(sourceContainer()).getByText('High')).toBeVisible()
        )

        await user.click(within(sourceContainer()).getByText('High'))
        await user.click(
            screen.getByTestId('band-filter-transfer-actions-addindividual')
        )

        expect(onChange).toHaveBeenCalledWith('IN:low;high')
    })

    it('emits no condition (show all) when the last band is removed', async () => {
        const user = userEvent.setup()
        const { onChange } = await setup('IN:mid')

        await waitFor(() =>
            expect(within(pickedContainer()).getByText('Mid')).toBeVisible()
        )

        await user.click(within(pickedContainer()).getByText('Mid'))
        await user.click(
            screen.getByTestId('band-filter-transfer-actions-removeindividual')
        )

        expect(onChange).toHaveBeenCalledWith('')
    })

    it('enables reordering of the picked bands', async () => {
        await setup('IN:low;high')

        expect(
            await screen.findByTestId('band-filter-transfer-reorderingactions')
        ).toBeInTheDocument()
    })

    it('renders no colour swatch for the bands', async () => {
        await setup('')

        await waitFor(() =>
            expect(optionValuesIn(sourceContainer())).toHaveLength(3)
        )

        expect(document.body.innerHTML).not.toContain('#abcdef')
        expect(document.body.innerHTML).not.toContain('#fedcba')
        expect(document.body.innerHTML).not.toContain('#abc123')
    })
})
