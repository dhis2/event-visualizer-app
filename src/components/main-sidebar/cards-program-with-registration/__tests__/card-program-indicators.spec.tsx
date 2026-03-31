import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CardProgramIndicators } from '../card-program-indicators'
import type { UseDimensionListResult } from '@components/main-sidebar/use-dimension-list'
import type { DataSourceProgramWithRegistration } from '@types'

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

const createProgram = (): DataSourceProgramWithRegistration =>
    ({
        id: 'prog1',
        name: 'Test Program',
        programType: 'WITH_REGISTRATION',
        programStages: [],
        trackedEntityType: { id: 'tet1', name: 'Person' },
    } as DataSourceProgramWithRegistration)

describe('CardProgramIndicators', () => {
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

        const { container } = render(
            <CardProgramIndicators program={createProgram()} />
        )

        expect(container.innerHTML).toBe('')
    })

    it('renders the card when dimensions exist', () => {
        mockUseDimensionList.mockReturnValue({
            ...defaultListResult,
            dimensions: [
                {
                    id: 'pi1',
                    dimensionId: 'pi1',
                    name: 'Indicator 1',
                    dimensionType: 'PROGRAM_INDICATOR',
                    valueType: 'NUMBER',
                },
            ],
        })

        render(<CardProgramIndicators program={createProgram()} />)

        expect(screen.getByTestId('dimension-card')).toBeInTheDocument()
        expect(screen.getByTestId('card-title')).toHaveTextContent(
            'Program indicators'
        )
    })

    it('uses the correct dimension card key', () => {
        mockUseDimensionList.mockReturnValue({
            ...defaultListResult,
            dimensions: [
                {
                    id: 'pi1',
                    dimensionId: 'pi1',
                    name: 'Indicator 1',
                    dimensionType: 'PROGRAM_INDICATOR',
                    valueType: 'NUMBER',
                },
            ],
        })

        render(<CardProgramIndicators program={createProgram()} />)

        expect(screen.getByTestId('dimension-card')).toHaveAttribute(
            'data-card-key',
            'program-indicators'
        )
    })
})
