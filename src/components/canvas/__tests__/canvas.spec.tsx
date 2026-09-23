import {
    DIMENSION_ID,
    metadata,
    populatedVis,
} from '@components/layout-panel/bottom-bar/__fixtures__/unapplied-changes'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import type { Layout, RootState } from '@types'
import { describe, it, expect, vi } from 'vitest'
import { Canvas } from '../canvas'

vi.mock('@components/plugin-wrapper/plugin-wrapper', () => ({
    PluginWrapper: () => <div data-test="plugin-wrapper" />,
}))

const layoutWithDimension = {
    columns: [DIMENSION_ID],
    rows: [],
    filters: [],
} as unknown as Layout

/* The notice stays mounted so it can fade out, so "hidden" is the aria-hidden
 * state rather than the absence of the element. */
const findNotice = () => screen.findByTestId('unapplied-changes')

const renderCanvas = (preloadedState: Partial<RootState>) =>
    renderWithAppWrapper(<Canvas />, {
        metadata,
        partialStore: { preloadedState },
    })

describe('Canvas unapplied changes notice', () => {
    it('is hidden when the visualization matches the ui config', async () => {
        await renderCanvas({ currentVis: populatedVis })

        expect(await findNotice()).toHaveAttribute('aria-hidden', 'true')
    })

    it('is shown when there are unapplied changes', async () => {
        await renderCanvas({
            currentVis: populatedVis,
            visUiConfig: { layout: layoutWithDimension },
        } as Partial<RootState>)

        const notice = await findNotice()

        expect(notice).toHaveAttribute('aria-hidden', 'false')
        expect(notice).toHaveTextContent('Changes not applied')
    })

    it('is hidden while the visualization is loading', async () => {
        await renderCanvas({
            currentVis: populatedVis,
            visUiConfig: { layout: layoutWithDimension },
            loader: { isVisualizationLoading: true },
        } as Partial<RootState>)

        expect(await findNotice()).toHaveAttribute('aria-hidden', 'true')
    })
})
