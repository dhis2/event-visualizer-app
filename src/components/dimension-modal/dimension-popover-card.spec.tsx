import { render, screen } from '@testing-library/react'
import type { DimensionMetadataItem } from '@types'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { DimensionPopoverCard } from './dimension-popover-card'

const mockDispatch = vi.fn()

vi.mock('@hooks', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: () => ({
        columns: [],
        filters: [],
        rows: [],
    }),
    useCurrentUser: () => ({
        settings: {
            uiLocale: 'en',
        },
    }),
}))

vi.mock('./add-to-layout-button', () => ({
    AddToLayoutButton: () => <button type="button">Add to layout</button>,
}))

vi.mock('./conditions-modal-content/conditions-modal-content', () => ({
    ConditionsModalContent: () => <div>Conditions content</div>,
}))

vi.mock(
    './dynamic-dimension-modal-content/dynamic-dimension-modal-content',
    () => ({
        DynamicDimensionModalContent: () => <div>Dynamic content</div>,
    })
)

vi.mock('./orgunit-dimension-modal-content', () => ({
    OrgUnitDimensionModalContent: () => <div>Org unit content</div>,
}))

vi.mock('./period-dimension-modal-content', () => ({
    PeriodDimensionModalContent: () => <div>Period content</div>,
}))

vi.mock('./status-dimension-modal-content', () => ({
    StatusDimensionModalContent: () => <div>Status content</div>,
}))

const createDimension = (
    overrides: Partial<DimensionMetadataItem> = {}
): DimensionMetadataItem => ({
    id: 'dimension-id',
    dimensionId: 'dimension-id',
    name: 'Test dimension',
    dimensionType: 'DATA_ELEMENT',
    ...overrides,
})

describe('DimensionPopoverCard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows enrollment org unit info after the sidebar popover actions', () => {
        render(
            <DimensionPopoverCard
                dimension={createDimension({
                    id: 'program-id.ou',
                    dimensionId: 'ou',
                    dimensionType: 'ORGANISATION_UNIT',
                    name: 'Enrollment org. unit',
                    programId: 'program-id',
                })}
                onClose={vi.fn()}
            />
        )

        const infoBox = screen.getByTestId('dimension-popover-sidebar-info')
        const actions = screen.getByTestId('dimension-popover-sidebar-actions')
        const content = screen.getByTestId('dimension-popover-content')

        expect(infoBox).toHaveTextContent(
            'The org. unit collected during enrollment.'
        )
        expect(content.firstElementChild).toBe(actions)
        expect(actions.nextElementSibling).toBe(infoBox)
    })

    it('uses per-stage event org unit info when a program stage is present', () => {
        render(
            <DimensionPopoverCard
                dimension={createDimension({
                    id: 'stage-id.ou',
                    dimensionId: 'ou',
                    dimensionType: 'ORGANISATION_UNIT',
                    name: 'Event org. unit',
                    programId: 'program-id',
                    programStageId: 'stage-id',
                })}
                onClose={vi.fn()}
            />
        )

        expect(
            screen.getByTestId('dimension-popover-sidebar-info')
        ).toHaveTextContent(
            'The org. unit where the event was registered for this program stage.'
        )
    })

    it('shows metadata dimension info in the sidebar popover', () => {
        render(
            <DimensionPopoverCard
                dimension={createDimension({
                    id: 'completed',
                    dimensionId: 'completed',
                    dimensionType: 'PERIOD',
                    name: 'Completed on',
                })}
                onClose={vi.fn()}
            />
        )

        expect(
            screen.getByTestId('dimension-popover-sidebar-info')
        ).toHaveTextContent(
            'The date when the event or enrollment was completed.'
        )
    })

    it.each([
        ['enrollmentDate', 'The date the enrollment was registered.'],
        ['incidentDate', 'The incident date recorded for the enrollment.'],
        ['programStatus', 'The current enrollment status, such as active'],
        ['eventDate', 'The date the event occurred for this program stage.'],
        [
            'scheduledDate',
            'The scheduled date for events in this program stage.',
        ],
        ['eventStatus', 'The status of events in this program stage'],
        ['lastUpdated', 'most recently updated'],
        ['lastUpdatedBy', 'The user who most recently updated'],
        ['created', 'was created'],
        ['createdBy', 'The user who created'],
    ])('shows sidebar info for %s', (dimensionId, expectedText) => {
        render(
            <DimensionPopoverCard
                dimension={createDimension({
                    id: `test.${dimensionId}`,
                    dimensionId,
                    dimensionType:
                        dimensionId === 'programStatus' ||
                        dimensionId === 'eventStatus'
                            ? 'STATUS'
                            : 'PERIOD',
                    name: dimensionId,
                    programId: 'program-id',
                    programStageId: dimensionId.startsWith('event')
                        ? 'stage-id'
                        : undefined,
                })}
                onClose={vi.fn()}
            />
        )

        expect(
            screen.getByTestId('dimension-popover-sidebar-info')
        ).toHaveTextContent(expectedText)
    })

    it('does not show an info box for unrelated sidebar dimensions', () => {
        render(
            <DimensionPopoverCard
                dimension={createDimension()}
                onClose={vi.fn()}
            />
        )

        expect(
            screen.queryByTestId('dimension-popover-sidebar-info')
        ).not.toBeInTheDocument()
    })

    it('does not show the sidebar info box in the layout popover', () => {
        render(
            <DimensionPopoverCard
                dimension={createDimension({
                    id: 'program-id.programStatus',
                    dimensionId: 'programStatus',
                    dimensionType: 'STATUS',
                    name: 'Enrollment status',
                    programId: 'program-id',
                })}
                onClose={vi.fn()}
            />
        )

        expect(
            screen.queryByTestId('dimension-popover-sidebar-info')
        ).not.toBeInTheDocument()
    })
})
