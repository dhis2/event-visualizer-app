import {
    DIMENSION_ID,
    metadata,
    populatedVis,
} from '@components/layout-panel/bottom-bar/__fixtures__/unapplied-changes'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import type { Layout, RootState } from '@types'
import { describe, it, expect } from 'vitest'
import { UnappliedChangesOverlay } from '../unapplied-changes-overlay'

const layoutWithDimension = {
    columns: [DIMENSION_ID],
    rows: [],
    filters: [],
} as unknown as Layout

/* The notice stays mounted so it can fade out, so "hidden" is the aria-hidden
 * state rather than the absence of the element. */
const findNotice = () => screen.findByTestId('unapplied-changes')

const renderOverlay = (preloadedState: Partial<RootState>) =>
    renderWithAppWrapper(
        <UnappliedChangesOverlay>
            <div data-test="canvas-content" />
        </UnappliedChangesOverlay>,
        { metadata, partialStore: { preloadedState } }
    )

describe('UnappliedChangesOverlay', () => {
    it('renders its children', async () => {
        await renderOverlay({ currentVis: populatedVis })

        expect(await screen.findByTestId('canvas-content')).toBeInTheDocument()
    })

    it('hides the notice when the visualization matches the ui config', async () => {
        await renderOverlay({ currentVis: populatedVis })

        expect(await findNotice()).toHaveAttribute('aria-hidden', 'true')
    })

    it('shows the notice when there are unapplied changes', async () => {
        await renderOverlay({
            currentVis: populatedVis,
            visUiConfig: { layout: layoutWithDimension },
        } as Partial<RootState>)

        const notice = await findNotice()

        expect(notice).toHaveAttribute('aria-hidden', 'false')
        expect(notice).toHaveTextContent('Changes not applied')
    })

    it('hides the notice while the visualization is loading', async () => {
        await renderOverlay({
            currentVis: populatedVis,
            visUiConfig: { layout: layoutWithDimension },
            loader: { isVisualizationLoading: true },
        } as Partial<RootState>)

        expect(await findNotice()).toHaveAttribute('aria-hidden', 'true')
    })
})
