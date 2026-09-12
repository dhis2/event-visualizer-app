import { initialState as uiInitialState } from '@store/ui-slice'
import { initialState as visUiConfigInitialState } from '@store/vis-ui-config-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RootState } from '@types'
import deepmerge from 'deepmerge'
import { describe, it, expect, vi } from 'vitest'
import { DimensionModal } from '../dimension-modal'

const eventStatusDimension = {
    id: 'eventStatus',
    dimensionId: 'eventStatus',
    dimensionType: 'STATUS' as const,
    name: 'Event status',
}

const metadata = { eventStatus: eventStatusDimension }

const buildMockOptions = (isInLayout: boolean): MockOptions => ({
    metadata,
    partialStore: {
        preloadedState: deepmerge(
            {
                ui: uiInitialState,
                visUiConfig: visUiConfigInitialState,
            },
            {
                ui: { activeDimensionModal: 'eventStatus' },
                visUiConfig: {
                    layout: { columns: isInLayout ? ['eventStatus'] : [] },
                },
            }
        ) as Partial<RootState>,
    },
})

describe('DimensionModal — actions', () => {
    it('shows Done as the only action when the dimension is in the layout, and it closes the modal', async () => {
        const onClose = vi.fn()
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <DimensionModal onClose={onClose} />,
            buildMockOptions(true)
        )

        const doneButton = await screen.findByRole('button', { name: 'Done' })
        expect(
            screen.queryByRole('button', { name: /^Add to/ })
        ).not.toBeInTheDocument()

        await user.click(doneButton)

        expect(onClose).toHaveBeenCalledOnce()
    })

    it('shows Done alongside "Add to ..." when the dimension is not in the layout, and Done closes the modal', async () => {
        const onClose = vi.fn()
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <DimensionModal onClose={onClose} />,
            buildMockOptions(false)
        )

        const doneButton = await screen.findByRole('button', { name: 'Done' })
        expect(
            screen.getByRole('button', { name: /^Add to/ })
        ).toBeInTheDocument()

        await user.click(doneButton)

        expect(onClose).toHaveBeenCalledOnce()
    })
})
