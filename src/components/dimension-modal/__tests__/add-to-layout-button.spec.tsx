import { initialState as uiInitialState } from '@store/ui-slice'
import {
    getVisUiConfigCellValue,
    getVisUiConfigConditionsByDimension,
    initialState as visUiConfigInitialState,
} from '@store/vis-ui-config-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RootState, VisualizationType } from '@types'
import { describe, it, expect, vi } from 'vitest'
import { AddToLayoutButton } from '../add-to-layout-button'

const stage1 = {
    id: 's1',
    name: 'Stage 1',
    repeatable: false,
    hideDueDate: false,
    program: { id: 'p1' },
}

const metadata = {
    p1: {
        id: 'p1',
        name: 'Program 1',
        programType: 'WITHOUT_REGISTRATION',
        programStages: [stage1],
    },
    s1: stage1,
    's1.de1': {
        id: 's1.de1',
        name: 'Weight in kg',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
        aggregationType: 'SUM',
    },
    's1.de2': {
        id: 's1.de2',
        name: 'Comment',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'TEXT',
    },
}

const buildMockOptions = ({
    dimensionId = 's1.de1',
    visualizationType = 'PIVOT_TABLE' as VisualizationType,
    condition,
}: {
    dimensionId?: string
    visualizationType?: VisualizationType
    condition?: string
} = {}): MockOptions => ({
    metadata,
    partialStore: {
        preloadedState: {
            ui: { ...uiInitialState, activeDimensionModal: dimensionId },
            visUiConfig: {
                ...visUiConfigInitialState,
                visualizationType,
                conditionsByDimension: condition
                    ? { [dimensionId]: { condition } }
                    : {},
            },
        } as Partial<RootState>,
    },
})

const openFlyout = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'Toggle dropdown' }))
}

describe('AddToLayoutButton — Use as value', () => {
    it('offers the action for a numeric dimension', async () => {
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <AddToLayoutButton onClick={vi.fn()} />,
            buildMockOptions()
        )

        await openFlyout(user)

        expect(
            screen.getByRole('menuitem', { name: 'Use as value' })
        ).toBeInTheDocument()
    })

    it('does not offer it for a non-numeric dimension', async () => {
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <AddToLayoutButton onClick={vi.fn()} />,
            buildMockOptions({ dimensionId: 's1.de2' })
        )

        await openFlyout(user)

        expect(
            screen.queryByRole('menuitem', { name: /Use as value/ })
        ).not.toBeInTheDocument()
    })

    it('does not offer it in a line list, which has no value axis', async () => {
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <AddToLayoutButton onClick={vi.fn()} />,
            buildMockOptions({ visualizationType: 'LINE_LIST' })
        )

        await openFlyout(user)

        expect(
            screen.queryByRole('menuitem', { name: /Use as value/ })
        ).not.toBeInTheDocument()
    })

    it('sets the cell value and closes the modal', async () => {
        const onClick = vi.fn()
        const user = userEvent.setup()
        const { store } = await renderWithAppWrapper(
            <AddToLayoutButton onClick={onClick} />,
            buildMockOptions()
        )

        await openFlyout(user)
        await user.click(screen.getByRole('menuitem', { name: 'Use as value' }))

        expect(getVisUiConfigCellValue(store.getState())).toEqual({
            id: 's1.de1',
            aggregationType: 'DEFAULT',
        })
        expect(onClick).toHaveBeenCalled()
    })

    it('names the filters it will drop, and drops them', async () => {
        const user = userEvent.setup()
        const { store } = await renderWithAppWrapper(
            <AddToLayoutButton onClick={vi.fn()} />,
            buildMockOptions({ condition: 'GT:5' })
        )

        await openFlyout(user)
        await user.click(
            screen.getByRole('menuitem', {
                name: 'Use as value (without filters)',
            })
        )

        expect(
            getVisUiConfigConditionsByDimension(store.getState(), 's1.de1')
                .condition
        ).toBeUndefined()
        expect(getVisUiConfigCellValue(store.getState())).toEqual({
            id: 's1.de1',
            aggregationType: 'DEFAULT',
        })
    })

    /* "Use as value" sits beside the axis options, so after filtering, the user
     * chooses between placing the dimension in an axis (filter kept) and making
     * it the cell value (filter dropped). */
    it('offers the value action alongside the axis options once a filter is set', async () => {
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <AddToLayoutButton onClick={vi.fn()} />,
            buildMockOptions({ condition: 'GT:5' })
        )

        await openFlyout(user)

        expect(
            screen.getAllByRole('menuitem').map((item) => item.textContent)
        ).toEqual([
            'Add to Rows',
            'Add to Filter',
            'Use as value (without filters)',
        ])
        expect(
            screen.getByRole('button', { name: 'Add to Columns' })
        ).toBeInTheDocument()
    })
})
