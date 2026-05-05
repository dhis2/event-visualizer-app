import type { UseDimensionListResult } from '@components/main-sidebar/use-dimension-list'
import { render, screen } from '@testing-library/react'
import type { MetadataItem } from '@types'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CardTrackedEntityType } from '../card-tracked-entity-type'

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

const createTrackedEntityType = (overrides: Partial<MetadataItem> = {}) =>
    ({
        id: 'tet1',
        name: 'Person',
        ...overrides,
    }) as MetadataItem

describe('CardTrackedEntityType', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUseDimensionList.mockReturnValue(defaultListResult)
        mockUseSelectedDimensionCount.mockReturnValue(0)
    })

    it('renders with title containing the tracked entity type name', () => {
        render(
            <CardTrackedEntityType
                trackedEntityType={createTrackedEntityType()}
            />
        )

        expect(screen.getByTestId('card-title')).toHaveTextContent(
            'Person registration'
        )
    })

    it('uses the correct dimension card key', () => {
        render(
            <CardTrackedEntityType
                trackedEntityType={createTrackedEntityType()}
            />
        )

        expect(screen.getByTestId('dimension-card')).toHaveAttribute(
            'data-card-key',
            'tracked-entity-type'
        )
    })

    it('passes a custom transformer to useDimensionList', () => {
        render(
            <CardTrackedEntityType
                trackedEntityType={createTrackedEntityType()}
            />
        )

        const call = mockUseDimensionList.mock.calls[0][0] as {
            transformer: unknown
        }
        expect(call.transformer).toBeDefined()
        expect(typeof call.transformer).toBe('function')
    })

    it('builds a query for trackedEntityTypes resource', () => {
        render(
            <CardTrackedEntityType
                trackedEntityType={createTrackedEntityType()}
            />
        )

        const call = mockUseDimensionList.mock.calls[0][0] as {
            baseQuery: { resource: string; id: string }
        }
        expect(call.baseQuery.resource).toBe('trackedEntityTypes')
        expect(call.baseQuery.id).toBe('tet1')
    })

    it('passes selectedCount from useSelectedDimensionCount', () => {
        mockUseSelectedDimensionCount.mockReturnValue(4)

        render(
            <CardTrackedEntityType
                trackedEntityType={createTrackedEntityType()}
            />
        )

        expect(screen.getByTestId('dimension-card')).toHaveAttribute(
            'data-count',
            '4'
        )
    })
})
