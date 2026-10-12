import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { LayoutDimension } from '../chip'
import { ChipBase } from '../chip-base'
import { TooltipContent } from '../tooltip-content'

const dimension: LayoutDimension = {
    id: 'numeric-de',
    dimensionId: 'numeric-de',
    dimensionType: 'DATA_ELEMENT',
    name: 'Weight in kg',
}

const chipBaseProps = {
    dimensionType: dimension.dimensionType,
    dimensionName: dimension.name,
    itemsText: '',
    onClick: vi.fn(),
}

describe('ChipBase grouping icon', () => {
    it('marks a grouped dimension with an icon', () => {
        render(<ChipBase {...chipBaseProps} isGrouped />)

        expect(screen.getByTestId('chip-grouping')).toBeInTheDocument()
    })

    it('places the icon after the item counter', () => {
        render(<ChipBase {...chipBaseProps} itemsText="2" isGrouped />)

        expect(
            screen
                .getByTestId('chip-items')
                .compareDocumentPosition(screen.getByTestId('chip-grouping')) &
                Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy()
    })

    it('shows no icon when the dimension is not grouped', () => {
        render(<ChipBase {...chipBaseProps} />)

        expect(screen.queryByTestId('chip-grouping')).not.toBeInTheDocument()
    })
})

describe('TooltipContent grouping', () => {
    it('names the legend set and the selected groups', async () => {
        await renderWithAppWrapper(
            <TooltipContent
                dimension={dimension}
                itemIds={[]}
                conditions={{ legendSet: 'LEGEND_SET', condition: 'IN:L1;L2' }}
                digitGroupSeparator="SPACE"
                groupingName="Age 10y interval"
                axisId="columns"
            />,
            { metadata: { L1: '0 - 10', L2: '10 - 20' } }
        )

        expect(
            screen.getByText('Grouping: Age 10y interval')
        ).toBeInTheDocument()
        expect(screen.getByText('0 - 10')).toBeInTheDocument()
        expect(screen.getByText('10 - 20')).toBeInTheDocument()
    })

    it('names the legend set alone when no group is selected', async () => {
        await renderWithAppWrapper(
            <TooltipContent
                dimension={dimension}
                itemIds={[]}
                conditions={{ legendSet: 'LEGEND_SET' }}
                digitGroupSeparator="SPACE"
                groupingName="Age 10y interval"
                axisId="columns"
            />
        )

        expect(
            screen.getByText('Grouping: Age 10y interval')
        ).toBeInTheDocument()
        expect(
            screen.getByText('Showing all values for this dimension')
        ).toBeInTheDocument()
    })

    it('says nothing about grouping for an ungrouped dimension', async () => {
        await renderWithAppWrapper(
            <TooltipContent
                dimension={dimension}
                itemIds={[]}
                conditions={{}}
                digitGroupSeparator="SPACE"
                axisId="columns"
            />
        )

        expect(screen.queryByText(/Grouping:/)).not.toBeInTheDocument()
    })
})
