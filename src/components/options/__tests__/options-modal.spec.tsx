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
    it('renders a single "Hide" action that submits the options form, and it closes the modal', async () => {
        const onClose = vi.fn()
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <OptionsModal onClose={onClose} />,
            buildMockOptions()
        )

        const hideButton = await screen.findByRole('button', { name: 'Hide' })
        expect(hideButton).toHaveAttribute('type', 'submit')
        expect(hideButton).toHaveAttribute('form', 'options-modal-form')

        await user.click(hideButton)

        expect(onClose).toHaveBeenCalledOnce()
    })

    it('blocks "Hide" when the Top limit field holds a constraint-invalid value', async () => {
        const onClose = vi.fn()
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <OptionsModal onClose={onClose} />,
            buildMockOptions({ sortOrder: -1, topLimit: 10 })
        )

        const topLimitInput = await screen.findByRole('spinbutton', {
            name: 'Top limit',
        })
        await user.clear(topLimitInput)
        await user.type(topLimitInput, '0')
        expect(topLimitInput).toHaveValue(0)

        await user.click(screen.getByRole('button', { name: 'Hide' }))

        /* The modal's edits are already live in visUiConfig as the user
         * types, so an invalid value must not be allowed to sit in state
         * and be applied later. Native form validation blocking submission
         * here is the intended behaviour, not a bug. */
        expect(onClose).not.toHaveBeenCalled()
    })
})
