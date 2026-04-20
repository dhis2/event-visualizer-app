import type { UseDimensionListResult } from '@components/main-sidebar/use-dimension-list'
import { render, screen } from '@testing-library/react'
import type { DataSourceProgramWithRegistration } from '@types'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CardEnrollment } from '../card-enrollment'

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

const createProgram = (
    overrides: Partial<DataSourceProgramWithRegistration> = {}
): DataSourceProgramWithRegistration =>
    ({
        id: 'prog1',
        name: 'Test Program',
        programType: 'WITH_REGISTRATION',
        programStages: [],
        trackedEntityType: { id: 'tet1', name: 'Person' },
        ...overrides,
    }) as DataSourceProgramWithRegistration

describe('CardEnrollment', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUseDimensionList.mockReturnValue(defaultListResult)
        mockUseSelectedDimensionCount.mockReturnValue(0)
    })

    it('renders with default title when displayEnrollmentLabel is not set', () => {
        render(<CardEnrollment program={createProgram()} />)

        expect(screen.getByTestId('card-title')).toHaveTextContent(
            'Enrollment data'
        )
    })

    it('renders with custom displayEnrollmentLabel', () => {
        render(
            <CardEnrollment
                program={createProgram({
                    displayEnrollmentLabel: 'Custom Enrollment',
                })}
            />
        )

        expect(screen.getByTestId('card-title')).toHaveTextContent(
            'Custom Enrollment'
        )
    })

    it('uses the correct dimension card key', () => {
        render(<CardEnrollment program={createProgram()} />)

        expect(screen.getByTestId('dimension-card')).toHaveAttribute(
            'data-card-key',
            'enrollment'
        )
    })

    it('passes fixed dimensions with program-scoped compound IDs', () => {
        render(<CardEnrollment program={createProgram()} />)

        const call = mockUseDimensionList.mock.calls[0][0] as {
            fixedDimensions: Array<{ id: string; dimensionType: string }>
        }
        const fixedDimensions = call.fixedDimensions

        expect(fixedDimensions).toHaveLength(4)
        expect(fixedDimensions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 'prog1.enrollmentOu',
                    dimensionType: 'ORGANISATION_UNIT',
                }),
                expect.objectContaining({
                    id: 'prog1.enrollmentDate',
                    dimensionType: 'PERIOD',
                }),
                expect.objectContaining({
                    id: 'prog1.incidentDate',
                    dimensionType: 'PERIOD',
                }),
                expect.objectContaining({
                    id: 'prog1.programStatus',
                    dimensionType: 'STATUS',
                }),
            ])
        )
    })

    it('uses custom label for org unit dimension when displayOrgUnitLabel is set', () => {
        render(
            <CardEnrollment
                program={createProgram({
                    displayOrgUnitLabel: 'Facility',
                })}
            />
        )

        const call = mockUseDimensionList.mock.calls[0][0] as {
            fixedDimensions: Array<{ id: string; name: string }>
        }
        const ouDimension = call.fixedDimensions.find(
            (d) => d.id === 'prog1.enrollmentOu'
        )
        expect(ouDimension?.name).toBe('Facility')
    })

    it('uses custom label for enrollment date when displayEnrollmentDateLabel is set', () => {
        render(
            <CardEnrollment
                program={createProgram({
                    displayEnrollmentDateLabel: 'Registration date',
                })}
            />
        )

        const call = mockUseDimensionList.mock.calls[0][0] as {
            fixedDimensions: Array<{ id: string; name: string }>
        }
        const dateDimension = call.fixedDimensions.find(
            (d) => d.id === 'prog1.enrollmentDate'
        )
        expect(dateDimension?.name).toBe('Registration date')
    })

    it('passes selectedCount from useSelectedDimensionCount', () => {
        mockUseSelectedDimensionCount.mockReturnValue(3)

        render(<CardEnrollment program={createProgram()} />)

        expect(screen.getByTestId('dimension-card')).toHaveAttribute(
            'data-count',
            '3'
        )
    })

    it('does not pass a baseQuery to useDimensionList', () => {
        render(<CardEnrollment program={createProgram()} />)

        const call = mockUseDimensionList.mock.calls[0][0] as {
            baseQuery?: unknown
        }
        expect(call.baseQuery).toBeUndefined()
    })
})
