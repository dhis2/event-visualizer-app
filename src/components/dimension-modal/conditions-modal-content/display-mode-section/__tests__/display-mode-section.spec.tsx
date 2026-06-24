import type { ConditionsObject } from '@store/vis-ui-config-slice'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DisplayModeSection } from '../display-mode-section'

const twoSets = [
    { id: 'ls1', name: 'Age 10y intervals' },
    { id: 'ls2', name: 'Weight bands' },
]

const setup = (
    conditions: ConditionsObject,
    {
        legendSets = twoSets,
        defaultLegendSetId = 'ls1',
    }: {
        legendSets?: Array<{ id: string; name: string }>
        defaultLegendSetId?: string
    } = {}
) => {
    const onChange = vi.fn()
    render(
        <DisplayModeSection
            conditions={conditions}
            legendSets={legendSets}
            defaultLegendSetId={defaultLegendSetId}
            onChange={onChange}
        />
    )
    return { onChange }
}

describe('DisplayModeSection', () => {
    it('renders both display radios', () => {
        setup({})

        expect(
            screen.getByRole('radio', { name: 'Exact values' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('radio', { name: 'Group into ranges' })
        ).toBeInTheDocument()
    })

    it('selects "Exact values" by default (no legendSet)', () => {
        setup({})

        expect(
            screen.getByRole('radio', { name: 'Exact values' })
        ).toBeChecked()
        expect(
            screen.getByRole('radio', { name: 'Group into ranges' })
        ).not.toBeChecked()
    })

    it('selects "Group into ranges" when a legendSet is present', () => {
        setup({ legendSet: 'ls1' })

        expect(
            screen.getByRole('radio', { name: 'Group into ranges' })
        ).toBeChecked()
        expect(
            screen.getByRole('radio', { name: 'Exact values' })
        ).not.toBeChecked()
    })

    it('dispatches enterGroupMode(defaultLegendSetId) when choosing "Group into ranges"', async () => {
        const user = userEvent.setup()
        const { onChange } = setup({}, { defaultLegendSetId: 'ls2' })

        await user.click(
            screen.getByRole('radio', { name: 'Group into ranges' })
        )

        expect(onChange).toHaveBeenCalledWith({
            legendSet: 'ls2',
            condition: undefined,
        })
    })

    it('dispatches enterExactMode() when choosing "Exact values"', async () => {
        const user = userEvent.setup()
        const { onChange } = setup({ legendSet: 'ls1', condition: 'IN:b1' })

        await user.click(screen.getByRole('radio', { name: 'Exact values' }))

        expect(onChange).toHaveBeenCalledWith({
            legendSet: undefined,
            condition: undefined,
        })
    })

    it('shows the range picker as static text when only one legend set exists', () => {
        setup(
            { legendSet: 'ls1' },
            {
                legendSets: [{ id: 'ls1', name: 'Age 10y intervals' }],
                defaultLegendSetId: 'ls1',
            }
        )

        expect(screen.getByText('Age 10y intervals')).toBeInTheDocument()
        expect(
            screen.queryByTestId('display-mode-legend-set-select')
        ).not.toBeInTheDocument()
    })

    it('shows a dropdown of sets when more than one exists and re-points on selection', async () => {
        const user = userEvent.setup()
        const { onChange } = setup({ legendSet: 'ls1' })

        const select = screen.getByTestId('display-mode-legend-set-select')
        expect(select).toBeInTheDocument()

        await user.click(screen.getByText('Age 10y intervals'))
        await user.click(screen.getByText('Weight bands'))

        expect(onChange).toHaveBeenCalledWith({
            legendSet: 'ls2',
            condition: undefined,
        })
    })

    it('hides the range picker entirely in exact mode', () => {
        setup({})

        expect(screen.queryByText('Ranges from:')).not.toBeInTheDocument()
        expect(
            screen.queryByTestId('display-mode-legend-set-select')
        ).not.toBeInTheDocument()
    })
})
