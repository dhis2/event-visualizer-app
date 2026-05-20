import { render, screen } from '@testing-library/react'
import type { DataSourceProgramWithRegistration } from '@types'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CardEvent } from '../card-event'

const mockUseAppSelector = vi.fn()
const mockUseDimensionList = vi.fn()
const mockUseSelectedDimensionCount = vi.fn()
const mockComputeIsDisabledByFilter = vi.fn()

vi.mock('@hooks', () => ({
    useAppSelector: (...args: unknown[]) => mockUseAppSelector(...args),
    useCurrentUser: () => ({
        settings: { displayNameProperty: 'displayName' },
    }),
}))

vi.mock('@store/dimensions-selection-slice', () => ({
    getFilter: vi.fn(),
}))

vi.mock('@components/sidebar/use-dimension-list', () => ({
    useDimensionList: (...args: unknown[]) => mockUseDimensionList(...args),
    computeIsDisabledByFilter: (...args: unknown[]) =>
        mockComputeIsDisabledByFilter(...args),
}))

vi.mock('@components/sidebar/use-selected-dimension-count', () => ({
    useSelectedDimensionCount: (...args: unknown[]) =>
        mockUseSelectedDimensionCount(...args),
}))

vi.mock('@components/sidebar/dimension-card', () => ({
    DimensionCard: ({
        title,
        children,
        dimensionCardKey,
        withSubSections,
        isDisabledByFilter,
        selectedCount,
    }: {
        title: string
        children: React.ReactNode
        dimensionCardKey: string
        withSubSections: boolean
        isDisabledByFilter: boolean
        selectedCount: number
    }) => (
        <div
            data-test="dimension-card"
            data-card-key={dimensionCardKey}
            data-with-subsections={String(withSubSections)}
            data-disabled={String(isDisabledByFilter)}
            data-count={selectedCount}
        >
            <span data-test="card-title">{title}</span>
            {children}
        </div>
    ),
}))

vi.mock('../program-stage-subsection', () => ({
    ProgramStageSubsection: ({
        programStage,
    }: {
        programStage: { id: string; name: string }
    }) => (
        <div data-test={`stage-subsection-${programStage.id}`}>
            {programStage.name}
        </div>
    ),
}))

const createProgram = (
    overrides: Partial<DataSourceProgramWithRegistration> = {}
): DataSourceProgramWithRegistration =>
    ({
        id: 'prog1',
        name: 'Test Program',
        programType: 'WITH_REGISTRATION',
        programStages: [
            { id: 'stageA', name: 'Stage A', program: { id: 'prog1' } },
            { id: 'stageB', name: 'Stage B', program: { id: 'prog1' } },
        ],
        trackedEntityType: { id: 'tet1', name: 'Person' },
        ...overrides,
    }) as DataSourceProgramWithRegistration

describe('CardEvent (with registration)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUseAppSelector.mockReturnValue(null)
        mockComputeIsDisabledByFilter.mockReturnValue(false)
        mockUseSelectedDimensionCount.mockReturnValue(0)
    })

    it('renders with default title when displayEventLabel is not set', () => {
        render(<CardEvent program={createProgram()} />)

        expect(screen.getByTestId('card-title')).toHaveTextContent('Event data')
    })

    it('renders with custom displayEventLabel', () => {
        render(
            <CardEvent
                program={createProgram({
                    displayEventLabel: 'Custom Events',
                })}
            />
        )

        expect(screen.getByTestId('card-title')).toHaveTextContent(
            'Custom Events'
        )
    })

    it('uses the correct dimension card key', () => {
        render(<CardEvent program={createProgram()} />)

        expect(screen.getByTestId('dimension-card')).toHaveAttribute(
            'data-card-key',
            'event-with-registration'
        )
    })

    it('renders with withSubSections=true', () => {
        render(<CardEvent program={createProgram()} />)

        expect(screen.getByTestId('dimension-card')).toHaveAttribute(
            'data-with-subsections',
            'true'
        )
    })

    it('renders a ProgramStageSubsection for each program stage', () => {
        render(<CardEvent program={createProgram()} />)

        expect(
            screen.getByTestId('stage-subsection-stageA')
        ).toBeInTheDocument()
        expect(
            screen.getByTestId('stage-subsection-stageB')
        ).toBeInTheDocument()
    })

    it('passes isDisabledByFilter from computeIsDisabledByFilter', () => {
        mockComputeIsDisabledByFilter.mockReturnValue(true)

        render(<CardEvent program={createProgram()} />)

        expect(screen.getByTestId('dimension-card')).toHaveAttribute(
            'data-disabled',
            'true'
        )
    })

    it('passes selectedCount from useSelectedDimensionCount', () => {
        mockUseSelectedDimensionCount.mockReturnValue(7)

        render(<CardEvent program={createProgram()} />)

        expect(screen.getByTestId('dimension-card')).toHaveAttribute(
            'data-count',
            '7'
        )
    })

    it('renders correctly with a single stage', () => {
        const program = createProgram({
            programStages: [
                { id: 'only', name: 'Only Stage', program: { id: 'prog1' } },
            ] as DataSourceProgramWithRegistration['programStages'],
        })

        render(<CardEvent program={program} />)

        expect(screen.getByTestId('stage-subsection-only')).toBeInTheDocument()
        expect(screen.getAllByTestId(/^stage-subsection-/)).toHaveLength(1)
    })
})
