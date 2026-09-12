import { initialState as visUiConfigInitialState } from '@store/vis-ui-config-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RootState } from '@types'
import deepmerge from 'deepmerge'
import { describe, it, expect, vi } from 'vitest'
import { OptionsModal } from '../options-modal'

const buildMockOptions = (
    optionsOverride: Partial<RootState['visUiConfig']['options']> = {}
): MockOptions => ({
    partialStore: {
        preloadedState: deepmerge(
            { visUiConfig: visUiConfigInitialState },
            {
                visUiConfig: {
                    visualizationType: 'PIVOT_TABLE',
                    options: optionsOverride,
                },
            }
        ) as Partial<RootState>,
    },
})

describe('OptionsModal — actions', () => {
    it('renders a single "Done" action that submits the options form, and it closes the modal', async () => {
        const onClose = vi.fn()
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <OptionsModal onClose={onClose} />,
            buildMockOptions()
        )

        /* Submitting the form is what closes the modal, which makes the form
         * a validation boundary: the modal's edits are already live in
         * visUiConfig, so an invalid field must not be dismissed and applied
         * later. */
        const doneButton = await screen.findByRole('button', { name: 'Done' })
        expect(doneButton).toHaveAttribute('type', 'submit')
        expect(doneButton).toHaveAttribute('form', 'options-modal-form')

        await user.click(doneButton)

        expect(onClose).toHaveBeenCalledOnce()
    })
})
