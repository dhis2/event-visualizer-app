import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CardEvent, getProgramStage } from '../card-event'
import type { UseDimensionListResult } from '@components/main-sidebar/use-dimension-list'
import type { DataSourceProgramWithoutRegistration } from '@types'

const mockUseDimensionList = vi.fn()
const mockUseSelectedDimensionCount = vi.fn()

vi.mock('@components/main-sidebar/use-dimension-list', () => ({
    useDimensionList: (...args: unknown[]) => mockUseDimensionList(...args),
}))

vi.mock('@components/main-sidebar/use-selected-dimension-count', () => ({
    useSelectedDimensionCount: (...args: unknown[]) =>
        mockUseSelectedDimensionCount(...args),
}))

vi.mock('@hooks', () => ({
    useCurrentUser: () => ({
        settings: { displayNameProperty: 'displayName' },
    }),
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
        <div data-test="dimension-card" data-card-key={dimensionCardKey}>
            <span data-test="card-title">{title}</span>
            <span data-test="card-disabled">{String(isDisabledByFilter)}</span>
            <span data-test="card-count">{selectedCount}</span>
            {children}
        </div>
    ),
    DimensionList: (props: { program: unknown; programStage: unknown }) => (
        <div
            data-test="dimension-list"
            data-has-program={String(!!props.program)}
            data-has-stage={String(!!props.programStage)}
        />
    ),
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

const createProgram = (
    overrides: Partial<DataSourceProgramWithoutRegistration> = {}
): DataSourceProgramWithoutRegistration =>
    ({
        id: 'prog1',
        name: 'Test Program',
        programType: 'WITHOUT_REGISTRATION',
        programStages: [
            {
                id: 'stage1',
                name: 'Stage 1',
                program: { id: 'prog1' },
            },
        ],
        ...overrides,
    } as DataSourceProgramWithoutRegistration)

describe('CardEvent (without registration)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUseDimensionList.mockReturnValue(defaultListResult)
        mockUseSelectedDimensionCount.mockReturnValue(0)
    })

    it('renders with default title when displayEventLabel is not set', () => {
        render(<CardEvent program={createProgram()} />)

        expect(screen.getByTestId('card-title')).toHaveTextContent('Event')
    })

    it('renders with custom displayEventLabel when set', () => {
        render(
            <CardEvent
                program={createProgram({
                    displayEventLabel: 'Custom Event',
                })}
            />
        )

        expect(screen.getByTestId('card-title')).toHaveTextContent(
            'Custom Event'
        )
    })

    it('uses the correct dimension card key', () => {
        render(<CardEvent program={createProgram()} />)

        expect(screen.getByTestId('dimension-card')).toHaveAttribute(
            'data-card-key',
            'event-without-registration'
        )
    })

    it('passes program and programStage to DimensionList', () => {
        render(<CardEvent program={createProgram()} />)

        const list = screen.getByTestId('dimension-list')
        expect(list).toHaveAttribute('data-has-program', 'true')
        expect(list).toHaveAttribute('data-has-stage', 'true')
    })

    it('passes isDisabledByFilter from useDimensionList', () => {
        mockUseDimensionList.mockReturnValue({
            ...defaultListResult,
            isDisabledByFilter: true,
        })

        render(<CardEvent program={createProgram()} />)

        expect(screen.getByTestId('card-disabled')).toHaveTextContent('true')
    })

    it('passes selectedCount from useSelectedDimensionCount', () => {
        mockUseSelectedDimensionCount.mockReturnValue(5)

        render(<CardEvent program={createProgram()} />)

        expect(screen.getByTestId('card-count')).toHaveTextContent('5')
    })

    it('throws when program has no stages', () => {
        const program = createProgram({
            programStages: [],
        })

        expect(() => getProgramStage(program)).toThrow(
            'No programStage found for program "prog1"'
        )
    })

    it('throws when programStages is undefined', () => {
        const program = createProgram({
            programStages: undefined as unknown as [],
        })

        expect(() => getProgramStage(program)).toThrow()
    })
})
