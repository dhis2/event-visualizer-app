import type { ConditionsObject } from '@store/vis-ui-config-slice'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { LayoutDimension } from '../chip'
import { TooltipContent } from '../tooltip-content'

const numericDimension: LayoutDimension = {
    id: 'numdim',
    dimensionId: 'numdim',
    dimensionType: 'DATA_ELEMENT',
    name: 'Weight',
    valueType: 'NUMBER',
}

const renderTooltip = (
    conditions: ConditionsObject,
    conditionsTexts: string[] = []
) =>
    renderWithAppWrapper(
        <TooltipContent
            dimension={numericDimension}
            conditions={conditions}
            conditionsTexts={conditionsTexts}
            axisId="columns"
        />,
        {
            metadata: {
                ls1: { id: 'ls1', name: 'Age 10y intervals', legends: [] },
            },
        }
    )

describe('TooltipContent — grouped into ranges', () => {
    it('shows the legend-set name on a "Ranges:" line when grouped', async () => {
        await renderTooltip({ legendSet: 'ls1' }, ['Age 10y intervals'])

        expect(
            screen.getByText('Ranges: Age 10y intervals')
        ).toBeInTheDocument()
    })

    it('does not also list the legend-set name as an item in show-all mode', async () => {
        await renderTooltip({ legendSet: 'ls1' }, ['Age 10y intervals'])

        // appears once (the "Ranges:" line), not duplicated as a plain item
        expect(screen.getAllByText(/Age 10y intervals/)).toHaveLength(1)
    })

    it('shows the band names alongside the "Ranges:" line when band-filtered', async () => {
        await renderTooltip({ legendSet: 'ls1', condition: 'IN:b1;b2' }, [
            'Low',
            'High',
        ])

        expect(
            screen.getByText('Ranges: Age 10y intervals')
        ).toBeInTheDocument()
        expect(screen.getByText('Low')).toBeInTheDocument()
        expect(screen.getByText('High')).toBeInTheDocument()
    })

    it('shows no "Ranges:" line for an exact dimension', async () => {
        await renderTooltip({ condition: 'GT:5' }, ['Greater than (>): 5'])

        expect(screen.queryByText(/^Ranges:/)).not.toBeInTheDocument()
        expect(screen.getByText('Greater than (>): 5')).toBeInTheDocument()
    })
})
