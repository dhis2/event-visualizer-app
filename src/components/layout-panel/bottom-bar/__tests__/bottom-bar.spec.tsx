import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import type { RootState } from '@types'
import { describe, it, expect } from 'vitest'
import { metadata, populatedVis } from '../__fixtures__/unapplied-changes'
import { BottomBar } from '../bottom-bar'

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

describe('BottomBar', () => {
    it('shows the output type buttons once a data source is selected', async () => {
        await renderBottomBar({ currentVis: populatedVis })

        expect(await screen.findByTestId('update-buttons')).toBeInTheDocument()
    })

    it('hides the output type buttons while the visualization is loading', async () => {
        await renderBottomBar({
            currentVis: populatedVis,
            loader: { isVisualizationLoading: true },
        } as Partial<RootState>)

        expect(screen.queryByTestId('update-buttons')).not.toBeInTheDocument()
    })
})
