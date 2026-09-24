import { initialState as visUiConfigInitialState } from '@store/vis-ui-config-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AggregationType, RootState } from '@types'
import { describe, it, expect } from 'vitest'
import { CellValueAxis } from '../cell-value-axis'

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
}

const buildMockOptions = ({
    columns,
    cellValue,
}: {
    columns: string[]
    cellValue?: { id: string; aggregationType: AggregationType }
}): MockOptions => ({
    metadata,
    partialStore: {
        preloadedState: {
            visUiConfig: {
                ...visUiConfigInitialState,
                visualizationType: 'PIVOT_TABLE',
                outputType: 'EVENT',
                layout: { ...visUiConfigInitialState.layout, columns },
                cellValue,
            },
        } as Partial<RootState>,
    },
})

const getTrigger = () => screen.getByTestId('axis-content-value')

describe('CellValueAxis', () => {
    it('is labelled as the value axis', async () => {
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({ columns: ['s1.de1'] })
        )

        expect(screen.getByTestId('axis-value')).toHaveTextContent('Value')
    })

    it('shows Count when no cell value is set', async () => {
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({ columns: ['s1.de1'] })
        )

        expect(getTrigger()).toHaveTextContent('Count')
    })

    it('shows the data item name and its aggregation type when a cell value is set', async () => {
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({
                columns: ['s1.de1'],
                cellValue: { id: 's1.de1', aggregationType: 'AVERAGE' },
            })
        )

        await waitFor(() => {
            expect(getTrigger()).toHaveTextContent('Weight in kg')
        })
        expect(getTrigger()).toHaveTextContent('Average')
        expect(getTrigger()).not.toHaveTextContent('Count')
    })

    it('falls back to the raw id when the cell value has no metadata', async () => {
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({
                columns: ['s1.de1'],
                cellValue: { id: 's9.unknown', aggregationType: 'SUM' },
            })
        )

        expect(getTrigger()).toHaveTextContent('s9.unknown')
        expect(getTrigger()).toHaveTextContent('Sum')
    })

    it('opens the cell value modal when clicked', async () => {
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({ columns: ['s1.de1'] })
        )

        await user.click(getTrigger())

        expect(await screen.findByTestId('cell-value-modal')).toBeVisible()
    })

    it('stays clickable whatever programs the layout holds', async () => {
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({ columns: ['s1.de1', 's2.de1'] })
        )

        expect(getTrigger()).toBeEnabled()
    })
})
