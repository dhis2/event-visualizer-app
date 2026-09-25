import { AddToLayoutButton } from '@components/dimension-modal/add-to-layout-button'
import { uiSlice, initialState as uiInitialState } from '@store/ui-slice'
import {
    getVisUiConfigCustomValue,
    initialState,
    visUiConfigSlice,
} from '@store/vis-ui-config-slice'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { VisualizationType } from '@types'
import { describe, it, expect, vi } from 'vitest'

const metadata = {
    weight: {
        id: 'weight',
        name: 'Weight in kg',
        dimensionType: 'PROGRAM_ATTRIBUTE',
        valueType: 'NUMBER',
    },
    name: {
        id: 'name',
        name: 'Name',
        dimensionType: 'PROGRAM_ATTRIBUTE',
        valueType: 'TEXT',
    },
}

const renderButton = async (
    dimensionId: keyof typeof metadata,
    visualizationType: VisualizationType = 'PIVOT_TABLE'
) => {
    const onClick = vi.fn()
    const view = await renderWithAppWrapper(
        <AddToLayoutButton onClick={onClick} />,
        {
            metadata,
            queryData: { trackedEntityAttributes: { aggregationType: 'SUM' } },
            partialStore: {
                reducer: {
                    visUiConfig: visUiConfigSlice.reducer,
                    ui: uiSlice.reducer,
                },
                preloadedState: {
                    visUiConfig: { ...initialState, visualizationType },
                    ui: {
                        ...uiInitialState,
                        activeDimensionModal: dimensionId,
                    },
                },
            },
        }
    )
    return { ...view, onClick }
}

const openFlyoutMenu = async (user: ReturnType<typeof userEvent.setup>) =>
    await user.click(screen.getByTestId('add-to-layout-button-toggle'))

describe('AddToLayoutButton — Add to Value', () => {
    it('sets a numeric dimension as the cell value', async () => {
        const user = userEvent.setup()
        const { store, onClick } = await renderButton('weight')

        await openFlyoutMenu(user)
        await user.click(screen.getByText('Add to Value'))

        await waitFor(() =>
            expect(getVisUiConfigCustomValue(store.getState())?.id).toBe(
                'weight'
            )
        )
        expect(onClick).toHaveBeenCalled()
    })

    it('is not offered for a dimension that cannot be aggregated', async () => {
        const user = userEvent.setup()
        await renderButton('name')

        await openFlyoutMenu(user)

        expect(screen.getByText('Add to Filter')).toBeInTheDocument()
        expect(screen.queryByText('Add to Value')).not.toBeInTheDocument()
    })

    it('is not offered in a line list', async () => {
        const user = userEvent.setup()
        await renderButton('weight', 'LINE_LIST')

        await openFlyoutMenu(user)

        expect(screen.getByText('Add to Filter')).toBeInTheDocument()
        expect(screen.queryByText('Add to Value')).not.toBeInTheDocument()
    })
})
