import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CardMetadata } from '../card-metadata'
import type { UseDimensionListResult } from '@components/main-sidebar/use-dimension-list'

const mockUseDimensionList = vi.fn()
const mockUseSelectedDimensionCount = vi.fn()

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
        isDisabledByFilter,
        selectedCount,
    }: {
        title: string
        children: React.ReactNode
        dimensionCardKey: string
        isDisabledByFilter: boolean
        selectedCount: number
    }) => (
        <div
            data-test="dimension-card"
            data-card-key={dimensionCardKey}
            data-disabled={String(isDisabledByFilter)}
            data-count={selectedCount}
        >
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

describe('CardMetadata', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUseDimensionList.mockReturnValue(defaultListResult)
        mockUseSelectedDimensionCount.mockReturnValue(0)
    })

    it('renders the card with correct title', () => {
        render(<CardMetadata />)

        expect(screen.getByTestId('card-title')).toHaveTextContent('Metadata')
    })

    it('uses the correct dimension card key', () => {
        render(<CardMetadata />)

        expect(screen.getByTestId('dimension-card')).toHaveAttribute(
            'data-card-key',
            'metadata'
        )
    })

    it('passes isDisabledByFilter from useDimensionList', () => {
        mockUseDimensionList.mockReturnValue({
            ...defaultListResult,
            isDisabledByFilter: true,
        })

        render(<CardMetadata />)

        expect(screen.getByTestId('dimension-card')).toHaveAttribute(
            'data-disabled',
            'true'
        )
    })

    it('passes selectedCount from useSelectedDimensionCount', () => {
        mockUseSelectedDimensionCount.mockReturnValue(2)

        render(<CardMetadata />)

        expect(screen.getByTestId('dimension-card')).toHaveAttribute(
            'data-count',
            '2'
        )
    })

    it('calls useDimensionList with fixed dimensions', () => {
        render(<CardMetadata />)

        expect(mockUseDimensionList).toHaveBeenCalledWith(
            expect.objectContaining({
                fixedDimensions: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'lastUpdated',
                        dimensionType: 'PERIOD',
                    }),
                    expect.objectContaining({
                        id: 'lastUpdatedBy',
                        dimensionType: 'USER',
                    }),
                    expect.objectContaining({
                        id: 'created',
                        dimensionType: 'PERIOD',
                    }),
                    expect.objectContaining({
                        id: 'createdBy',
                        dimensionType: 'USER',
                    }),
                    expect.objectContaining({
                        id: 'completed',
                        dimensionType: 'PERIOD',
                    }),
                ]),
            })
        )
    })

    it('provides 5 fixed dimensions', () => {
        render(<CardMetadata />)

        const call = mockUseDimensionList.mock.calls[0][0] as {
            fixedDimensions: unknown[]
        }
        expect(call.fixedDimensions).toHaveLength(5)
    })
})
