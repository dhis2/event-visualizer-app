import { initialState as visUiConfigInitialState } from '@store/vis-ui-config-slice'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { OutputType, RootState } from '@types'
import { describe, it, expect } from 'vitest'
import { RowGranularityLabel } from '../row-granularity-label'

const trackerStage = {
    id: 's1',
    name: 'Stage 1',
    repeatable: false,
    hideDueDate: false,
    program: { id: 'p1' },
}

const trackerProgram = {
    id: 'p1',
    name: 'Program 1',
    programType: 'WITH_REGISTRATION',
    programStages: [trackerStage],
    trackedEntityType: { id: 'tet1', name: 'Person' },
    displayEventLabel: 'Visit',
    displayEnrollmentLabel: 'Registration',
}

const eventProgram = {
    id: 'p2',
    name: 'Program 2',
    programType: 'WITHOUT_REGISTRATION',
    programStages: [{ ...trackerStage, id: 's2', program: { id: 'p2' } }],
}

const metadata = {
    p1: trackerProgram,
    s1: trackerStage,
    tet1: { id: 'tet1', name: 'Person' },
    p2: eventProgram,
    's2.de1': {
        id: 's2.de1',
        name: 'DE 1',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
        programId: 'p2',
        programStageId: 's2',
    },
    'tet1.enrollmentOu': {
        id: 'tet1.enrollmentOu',
        name: 'Registration org. unit',
        dimensionType: 'ORGANISATION_UNIT',
        trackedEntityTypeId: 'tet1',
    },
    's1.de1': {
        id: 's1.de1',
        name: 'DE 1',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
        programId: 'p1',
        programStageId: 's1',
    },
}

const buildMockOptions = (outputType: OutputType, columns: string[]) => ({
    metadata,
    partialStore: {
        preloadedState: {
            visUiConfig: {
                ...visUiConfigInitialState,
                outputType,
                layout: { ...visUiConfigInitialState.layout, columns },
            },
        } as Partial<RootState>,
    },
})

describe('RowGranularityLabel', () => {
    it('names the tracked entity type for TRACKED_ENTITY_INSTANCE output', async () => {
        await renderWithAppWrapper(
            <RowGranularityLabel />,
            buildMockOptions('TRACKED_ENTITY_INSTANCE', ['tet1.enrollmentOu'])
        )

        expect(screen.getByText('One row for each Person')).toBeInTheDocument()
    })

    it("uses the program's enrollment label for ENROLLMENT output", async () => {
        await renderWithAppWrapper(
            <RowGranularityLabel />,
            buildMockOptions('ENROLLMENT', ['s1.de1'])
        )

        expect(
            screen.getByText('One row for each Registration')
        ).toBeInTheDocument()
    })

    it("uses the program's event label for EVENT output", async () => {
        await renderWithAppWrapper(
            <RowGranularityLabel />,
            buildMockOptions('EVENT', ['s1.de1'])
        )

        expect(screen.getByText('One row for each Visit')).toBeInTheDocument()
    })

    it('falls back to a generic noun for a program without custom labels', async () => {
        await renderWithAppWrapper(
            <RowGranularityLabel />,
            buildMockOptions('EVENT', ['s2.de1'])
        )

        expect(screen.getByText('One row for each Event')).toBeInTheDocument()
    })

    it('mutes the label and explains why for an event list spanning programs', async () => {
        await renderWithAppWrapper(
            <RowGranularityLabel />,
            buildMockOptions('EVENT', ['s1.de1', 's2.de1'])
        )

        expect(screen.getByText('One row for each Visit')).toBeInTheDocument()

        await userEvent.hover(screen.getByText('One row for each Visit'))

        await waitFor(() => {
            expect(
                screen.getByText('Not valid with multiple programs')
            ).toBeInTheDocument()
        })
    })

    it('explains why for an event list without a program', async () => {
        await renderWithAppWrapper(
            <RowGranularityLabel />,
            buildMockOptions('EVENT', ['tet1.enrollmentOu'])
        )

        await userEvent.hover(screen.getByText('One row for each Event'))

        await waitFor(() => {
            expect(
                screen.getByText('Not valid without a program')
            ).toBeInTheDocument()
        })
    })

    it('leaves a tracked entity list alone when the layout spans programs', async () => {
        await renderWithAppWrapper(
            <RowGranularityLabel />,
            buildMockOptions('TRACKED_ENTITY_INSTANCE', ['s1.de1', 's2.de1'])
        )

        await userEvent.hover(screen.getByText('One row for each Person'))

        expect(
            screen.queryByText('Not valid with multiple programs')
        ).not.toBeInTheDocument()
    })

    it('renders no button, so it cannot be clicked', async () => {
        await renderWithAppWrapper(
            <RowGranularityLabel />,
            buildMockOptions('EVENT', ['s1.de1'])
        )

        expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
})
