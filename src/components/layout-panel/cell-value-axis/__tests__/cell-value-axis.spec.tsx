import { useDndContext } from '@dnd-kit/core'
import {
    getVisUiConfigCellValue,
    initialState as visUiConfigInitialState,
} from '@store/vis-ui-config-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AggregationType, RootState } from '@types'
import { describe, it, expect, vi } from 'vitest'
import { CellValueAxis } from '../cell-value-axis'

vi.mock('@dnd-kit/core', async () => {
    const actual = await vi.importActual('@dnd-kit/core')
    return {
        ...actual,
        useDroppable: vi.fn(() => ({ setNodeRef: vi.fn() })),
        useDndContext: vi.fn(() => ({ active: null, over: null })),
    }
})

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
        aggregationType: 'SUM',
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

    it('offers no aggregation or reset control when showing Count', async () => {
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({ columns: ['s1.de1'] })
        )

        expect(
            screen.queryByTestId('cell-value-aggregation-trigger')
        ).not.toBeInTheDocument()
        expect(screen.queryByTestId('cell-value-reset')).not.toBeInTheDocument()
    })

    it('resets to Count without confirmation', async () => {
        const user = userEvent.setup()
        const { store } = await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({
                columns: ['s1.de1'],
                cellValue: { id: 's1.de1', aggregationType: 'AVERAGE' },
            })
        )

        await user.click(screen.getByTestId('cell-value-reset'))

        expect(getVisUiConfigCellValue(store.getState())).toBeUndefined()
        expect(getTrigger()).toHaveTextContent('Count')
    })

    it('changes the aggregation type from the inline menu', async () => {
        const user = userEvent.setup()
        const { store } = await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({
                columns: ['s1.de1'],
                cellValue: { id: 's1.de1', aggregationType: 'AVERAGE' },
            })
        )

        await user.click(screen.getByTestId('cell-value-aggregation-trigger'))
        await user.click(screen.getByRole('menuitem', { name: 'Max' }))

        expect(getVisUiConfigCellValue(store.getState())).toEqual({
            id: 's1.de1',
            aggregationType: 'MAX',
        })
    })

    /* `DEFAULT` is resolved before storing, so the menu shows real names. */
    it('does not offer "Use item default" in the aggregation menu', async () => {
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({
                columns: ['s1.de1'],
                cellValue: { id: 's1.de1', aggregationType: 'AVERAGE' },
            })
        )

        await user.click(screen.getByTestId('cell-value-aggregation-trigger'))

        expect(
            screen.queryByRole('menuitem', { name: 'Use item default' })
        ).not.toBeInTheDocument()
    })

    it('stays clickable whatever programs the layout holds', async () => {
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({ columns: ['s1.de1', 's2.de1'] })
        )

        expect(getTrigger()).toBeEnabled()
    })

    /* The cell value carries program/stage context like any other dimension, so
     * it is suffixed by the same rules as the chips. */
    it('suffixes the name once the cell value widens the scope', async () => {
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({
                columns: ['s1.de1'],
                cellValue: { id: 's2.de1', aggregationType: 'SUM' },
            })
        )

        expect(screen.getByTestId('cell-value-suffix')).toHaveTextContent(
            'Stage 2'
        )
    })

    it('shows no suffix when everything is in one program', async () => {
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({
                columns: ['s1.de1'],
                cellValue: { id: 's1.de1', aggregationType: 'SUM' },
            })
        )

        expect(
            screen.queryByTestId('cell-value-suffix')
        ).not.toBeInTheDocument()
    })

    it('explains on hover what Count means and how to change it', async () => {
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({ columns: ['s1.de1'] })
        )

        await user.hover(screen.getByTestId('cell-value-label'))

        expect(
            await screen.findByText(
                'Cells show a count. Drag a numeric data item here to show its value.'
            )
        ).toBeInTheDocument()
    })

    it('does not explain Count once a data item is set', async () => {
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({
                columns: ['s1.de1'],
                cellValue: { id: 's1.de1', aggregationType: 'SUM' },
            })
        )

        await user.hover(screen.getByTestId('cell-value-label'))

        expect(screen.queryByText(/Cells show a count/)).not.toBeInTheDocument()
    })

    it('separates the name from the aggregation type with a middle dot', async () => {
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({
                columns: ['s1.de1'],
                cellValue: { id: 's1.de1', aggregationType: 'AVERAGE' },
            })
        )

        /* The gap around the dot is the flex gap, not whitespace. */
        expect(getTrigger()).toHaveTextContent('Weight in kg·Average')
    })

    /* Both items in the layout, one of them also the cell value: two stages are
     * in scope, so the value gets a stage suffix like the chips do. */
    it('suffixes the value when both stages are already in the layout', async () => {
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({
                columns: ['s1.de1', 's2.de1'],
                cellValue: { id: 's1.de1', aggregationType: 'SUM' },
            })
        )

        expect(screen.getByTestId('cell-value-suffix')).toHaveTextContent(
            'Stage 1'
        )
    })

    /* If the stored id is the plain uid rather than the compound stageId.deUid,
     * the dimension carries no stage and falls back to the program rule. */
    it('shows no stage when the cell value id is not stage-qualified', async () => {
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({
                columns: ['s1.de1', 's2.de1'],
                cellValue: { id: 'de1', aggregationType: 'SUM' },
            })
        )

        expect(
            screen.queryByTestId('cell-value-suffix')
        ).not.toBeInTheDocument()
    })

    /* s1.de1's own aggregation type is SUM, so the menu leads with a shortcut
     * naming it, and still lists Sum plainly below. */
    it('leads the aggregation menu with the data item default', async () => {
        const user = userEvent.setup()
        const { store } = await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({
                columns: ['s1.de1'],
                cellValue: { id: 's1.de1', aggregationType: 'AVERAGE' },
            })
        )

        await user.click(screen.getByTestId('cell-value-aggregation-trigger'))

        const items = screen
            .getAllByRole('menuitem')
            .map((item) => item.textContent)

        expect(items[0]).toBe('Use item default (Sum)')
        expect(items).toContain('Sum')
        expect(items).toContain('Average')

        /* Stored as the sentinel, so the shortcut stays distinguishable from an
         * explicit Sum. */
        await user.click(
            screen.getByRole('menuitem', { name: 'Use item default (Sum)' })
        )

        expect(getVisUiConfigCellValue(store.getState())).toEqual({
            id: 's1.de1',
            aggregationType: 'DEFAULT',
        })
    })

    /* The whole point of keeping the sentinel: picking the item's own type by
     * name is not the same choice as leaving it on the item default. */
    it('marks the shortcut and the plain entry separately', async () => {
        const user = userEvent.setup()
        const { store } = await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({
                columns: ['s1.de1'],
                cellValue: { id: 's1.de1', aggregationType: 'DEFAULT' },
            })
        )

        /* DEFAULT resolves to the item's SUM for display. */
        expect(
            screen.getByTestId('cell-value-aggregation-trigger')
        ).toHaveTextContent('Sum')

        await user.click(screen.getByTestId('cell-value-aggregation-trigger'))

        /* MenuItem puts the active class on the wrapping li, not the anchor
         * that carries the menuitem role. */
        const activeItem = () =>
            screen
                .getAllByRole('menuitem')
                .find((item) =>
                    item.closest('li')?.className.includes('active')
                )?.textContent

        expect(activeItem()).toBe('Use item default (Sum)')

        await user.click(screen.getByRole('menuitem', { name: 'Sum' }))

        expect(getVisUiConfigCellValue(store.getState())).toEqual({
            id: 's1.de1',
            aggregationType: 'SUM',
        })

        await user.click(screen.getByTestId('cell-value-aggregation-trigger'))

        expect(activeItem()).toBe('Sum')
    })
})

/* The axis rejects an invalid dimension on drop, so it must not invite one in
 * the first place. */
describe('CellValueAxis drop affordance', () => {
    const dragOverAxis = (canBeCellValue: boolean) => {
        vi.mocked(useDndContext).mockReturnValue({
            active: { data: { current: { canBeCellValue } } },
            over: { data: { current: { isCellValueDroppable: true } } },
        } as unknown as ReturnType<typeof useDndContext>)
    }

    const dragWithoutHovering = (canBeCellValue: boolean) => {
        vi.mocked(useDndContext).mockReturnValue({
            active: { data: { current: { canBeCellValue } } },
            over: null,
        } as unknown as ReturnType<typeof useDndContext>)
    }

    const axisClassName = () => screen.getByTestId('axis-value').className

    const blockedOverlay = () => screen.queryByTestId('layout-blocked-overlay')

    it('highlights for a dimension it would accept', async () => {
        dragOverAxis(true)
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({ columns: ['s1.de1'] })
        )

        expect(axisClassName()).toContain('activeDropTarget')
    })

    it('does not highlight for a dimension it would reject', async () => {
        dragOverAxis(false)
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({ columns: ['s1.de1'] })
        )

        expect(axisClassName()).not.toContain('activeDropTarget')
    })

    /* The overlay answers "would this drop work?", so it appears as soon as an
     * invalid dimension is picked up — not only once it reaches the axis. */
    it('covers itself while a dimension it would reject is being dragged', async () => {
        dragWithoutHovering(false)
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({ columns: ['s1.de1'] })
        )

        expect(blockedOverlay()).toBeInTheDocument()
    })

    it('does not cover itself for a dimension it would accept', async () => {
        dragWithoutHovering(true)
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({ columns: ['s1.de1'] })
        )

        expect(blockedOverlay()).not.toBeInTheDocument()
    })

    it('does not cover itself when nothing is being dragged', async () => {
        await renderWithAppWrapper(
            <CellValueAxis />,
            buildMockOptions({ columns: ['s1.de1'] })
        )

        expect(blockedOverlay()).not.toBeInTheDocument()
    })
})
