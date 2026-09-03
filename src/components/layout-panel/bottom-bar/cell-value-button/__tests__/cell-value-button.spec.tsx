import { initialState as visUiConfigInitialState } from '@store/vis-ui-config-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AggregationType, OutputType, RootState } from '@types'
import { describe, it, expect } from 'vitest'
import { CellValueButton } from '../cell-value-button'

const stage1 = {
    id: 's1',
    name: 'Stage 1',
    repeatable: false,
    hideDueDate: false,
    program: { id: 'p1' },
}
const stage2 = {
    id: 's2',
    name: 'Stage 2',
    repeatable: false,
    hideDueDate: false,
    program: { id: 'p2' },
}

const metadata = {
    p1: {
        id: 'p1',
        name: 'Program 1',
        programType: 'WITH_REGISTRATION',
        programStages: [stage1],
        trackedEntityType: { id: 'tet1', name: 'Person' },
        displayEventLabel: 'Visit',
        displayEnrollmentLabel: 'Registration',
    },
    p2: {
        id: 'p2',
        name: 'Program 2',
        programType: 'WITHOUT_REGISTRATION',
        programStages: [stage2],
    },
    s1: stage1,
    s2: stage2,
    tet1: { id: 'tet1', name: 'Person' },
    's1.de1': {
        id: 's1.de1',
        name: 'Weight in kg',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
        programId: 'p1',
        programStageId: 's1',
    },
    's2.de1': {
        id: 's2.de1',
        name: 'Height in cm',
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
}

const buildMockOptions = ({
    columns,
    outputType = 'EVENT',
    customValue,
}: {
    columns: string[]
    outputType?: OutputType
    customValue?: { id: string; aggregationType: AggregationType }
}): MockOptions => ({
    metadata,
    partialStore: {
        preloadedState: {
            visUiConfig: {
                ...visUiConfigInitialState,
                visualizationType: 'PIVOT_TABLE',
                outputType,
                layout: { ...visUiConfigInitialState.layout, columns },
                customValue,
            },
        } as Partial<RootState>,
    },
})

describe('CellValueButton', () => {
    it('falls back to the output type count when no custom value is set', async () => {
        await renderWithAppWrapper(
            <CellValueButton />,
            buildMockOptions({ columns: ['s1.de1'] })
        )

        expect(
            screen.getByRole('button', { name: 'Cells show Visit count' })
        ).toBeEnabled()
    })

    it('follows the output type in the count label', async () => {
        await renderWithAppWrapper(
            <CellValueButton />,
            buildMockOptions({
                columns: ['s1.de1'],
                outputType: 'ENROLLMENT',
            })
        )

        expect(
            screen.getByRole('button', {
                name: 'Cells show Registration count',
            })
        ).toBeInTheDocument()
    })

    it('names the custom value when one is set', async () => {
        await renderWithAppWrapper(
            <CellValueButton />,
            buildMockOptions({
                columns: ['s1.de1'],
                customValue: { id: 's1.de1', aggregationType: 'AVERAGE' },
            })
        )

        expect(
            screen.getByRole('button', { name: 'Cells show Weight in kg' })
        ).toBeInTheDocument()
    })

    it('opens the modal on click', async () => {
        await renderWithAppWrapper(
            <CellValueButton />,
            buildMockOptions({ columns: ['s1.de1'] })
        )

        await userEvent.click(screen.getByRole('button'))

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'Cell value' })
            ).toBeInTheDocument()
        })
    })

    it('is disabled without a program in the layout', async () => {
        await renderWithAppWrapper(
            <CellValueButton />,
            buildMockOptions({ columns: ['tet1.enrollmentOu'] })
        )

        expect(screen.getByRole('button')).toBeDisabled()

        await userEvent.hover(screen.getByRole('button'))

        await waitFor(() => {
            expect(
                screen.getByText('Not valid without a program')
            ).toBeInTheDocument()
        })
    })

    it('is disabled with multiple programs in the layout', async () => {
        await renderWithAppWrapper(
            <CellValueButton />,
            buildMockOptions({ columns: ['s1.de1', 's2.de1'] })
        )

        expect(screen.getByRole('button')).toBeDisabled()

        await userEvent.hover(screen.getByRole('button'))

        await waitFor(() => {
            expect(
                screen.getByText('Not valid with multiple programs')
            ).toBeInTheDocument()
        })
    })
})
