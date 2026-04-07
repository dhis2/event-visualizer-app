import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CardOther } from '../card-other'
import type { UseDimensionListResult } from '@components/main-sidebar/use-dimension-list'

const mockUseDimensionList = vi.fn()
const mockUseSelectedDimensionCount = vi.fn()

vi.mock('@hooks', () => ({
    useCurrentUser: () => ({
        settings: { displayNameProperty: 'displayName' },
    }),
}))

vi.mock('@components/main-sidebar/use-dimension-list', () => ({
    useDimensionList: (...args: unknown[]) => mockUseDimensionList(...args),
}))

vi.mock('@components/main-sidebar/use-selected-dimension-count', () => ({
    useSelectedDimensionCount: (...args: unknown[]) =>
        mockUseSelectedDimensionCount(...args),
}))

vi.mock('@components/main-sidebar/dimension-card', () => ({
    DimensionCard: ({
        title,
        children,
        dimensionCardKey,
    }: {
        title: string
        children: React.ReactNode
        dimensionCardKey: string
    }) => (
        <div data-test="dimension-card" data-card-key={dimensionCardKey}>
            <span data-test="card-title">{title}</span>
            {children}
        </div>
    ),
    DimensionList: () => <div data-test="dimension-list" />,
}))

const defaultListResult: UseDimensionListResult = {
    dimensions: [],
    isLoading: false,
    isFetchingMore: false,
    hasMore: false,
    hasNoData: false,
    loadMore: vi.fn(),
    isDisabledByFilter: false,
}

describe('CardOther', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUseDimensionList.mockReturnValue(defaultListResult)
        mockUseSelectedDimensionCount.mockReturnValue(0)
    })

    it('returns null when there are no dimensions', () => {
        mockUseDimensionList.mockReturnValue({
            ...defaultListResult,
            dimensions: [],
        })

        const { container } = render(<CardOther />)

        expect(container.innerHTML).toBe('')
    })

    it('renders the card when dimensions exist', () => {
        mockUseDimensionList.mockReturnValue({
            ...defaultListResult,
            dimensions: [
                {
                    id: 'ougs1',
                    dimensionId: 'ougs1',
                    name: 'OU Group Set 1',
                    dimensionType: 'ORGANISATION_UNIT_GROUP_SET',
                    valueType: 'TEXT',
                },
            ],
        })

        render(<CardOther />)

        expect(screen.getByTestId('dimension-card')).toBeInTheDocument()
        expect(screen.getByTestId('card-title')).toHaveTextContent('Other')
    })

    it('uses the correct dimension card key', () => {
        mockUseDimensionList.mockReturnValue({
            ...defaultListResult,
            dimensions: [
                {
                    id: 'ougs1',
                    dimensionId: 'ougs1',
                    name: 'OU Group Set 1',
                    dimensionType: 'ORGANISATION_UNIT_GROUP_SET',
                    valueType: 'TEXT',
                },
            ],
        })

        render(<CardOther />)

        expect(screen.getByTestId('dimension-card')).toHaveAttribute(
            'data-card-key',
            'other'
        )
    })
})
