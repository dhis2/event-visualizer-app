import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import type { Layout, RootState } from '@types'
import { describe, it, expect } from 'vitest'
import {
    DIMENSION_ID,
    metadata,
    populatedVis,
} from '../__fixtures__/unapplied-changes'
import { UnappliedChangesNotice } from '../unapplied-changes-notice'

const layoutWithDimension = {
    columns: [DIMENSION_ID],
    rows: [],
    filters: [],
} as unknown as Layout

const renderNotice = (preloadedState: Partial<RootState>) =>
    renderWithAppWrapper(<UnappliedChangesNotice />, {
        metadata,
        partialStore: { preloadedState },
    })

describe('UnappliedChangesNotice', () => {
    it('renders nothing when the visualization matches the ui config', async () => {
        await renderNotice({ currentVis: populatedVis })

        expect(
            screen.queryByTestId('unapplied-changes-notice')
        ).not.toBeInTheDocument()
    })

    it('renders the notice when there are unapplied changes', async () => {
        await renderNotice({
            currentVis: populatedVis,
            visUiConfig: { layout: layoutWithDimension },
        } as Partial<RootState>)

        expect(await screen.findByText('Unapplied changes')).toBeVisible()
    })

    it('renders nothing while the visualization is loading', async () => {
        await renderNotice({
            currentVis: populatedVis,
            visUiConfig: { layout: layoutWithDimension },
            loader: { isVisualizationLoading: true },
        } as Partial<RootState>)

        expect(
            screen.queryByTestId('unapplied-changes-notice')
        ).not.toBeInTheDocument()
    })
})
