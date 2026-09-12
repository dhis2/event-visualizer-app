import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import type { Layout, RootState } from '@types'
import { describe, it, expect } from 'vitest'
import {
    DIMENSION_ID,
    metadata,
    populatedVis,
} from '../__fixtures__/unapplied-changes'
import { BottomBar } from '../bottom-bar'

const layoutWithDimension = {
    columns: [DIMENSION_ID],
    rows: [],
    filters: [],
} as unknown as Layout

const renderBottomBar = (preloadedState: Partial<RootState>) =>
    renderWithAppWrapper(<BottomBar />, {
        metadata,
        partialStore: {
            preloadedState: {
                dimensionSelection: {
                    dataSourceId: 'program1',
                } as RootState['dimensionSelection'],
                ...preloadedState,
            },
        },
    })

describe('BottomBar unapplied changes indicator', () => {
    it('is absent when the visualization matches the ui config', async () => {
        await renderBottomBar({ currentVis: populatedVis })

        expect(
            screen.queryByTestId('unapplied-changes')
        ).not.toBeInTheDocument()
    })

    it('is shown when there are unapplied changes', async () => {
        await renderBottomBar({
            currentVis: populatedVis,
            visUiConfig: { layout: layoutWithDimension },
        } as Partial<RootState>)

        expect(await screen.findByText('Unapplied changes')).toBeVisible()
    })

    it('is absent while the visualization is loading, along with the buttons', async () => {
        await renderBottomBar({
            currentVis: populatedVis,
            visUiConfig: { layout: layoutWithDimension },
            loader: { isVisualizationLoading: true },
        } as Partial<RootState>)

        expect(
            screen.queryByTestId('unapplied-changes')
        ).not.toBeInTheDocument()
        expect(screen.queryByTestId('update-buttons')).not.toBeInTheDocument()
    })
})
