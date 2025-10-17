import { act, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import eventVisualization1 from '../__fixtures__/inpatient-cases-5-to-15-years-this-year.json'
import { TitleBar } from '../title-bar'
import { setCurrentVis } from '@store/current-vis-slice'
import { setSavedVis } from '@store/saved-vis-slice'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import type { SavedVisualization } from '@types'

describe('TitleBar', () => {
    it('should render null when the visualization is empty', async () => {
        await renderWithAppWrapper(<TitleBar />)

        expect(screen.queryByTestId('title-bar')).not.toBeInTheDocument()
    })

    it('should render the unsaved title when editing a new visualization ', async () => {
        const { store } = await renderWithAppWrapper(<TitleBar />)

        act(() =>
            // simulate an Update click with a minimum viable visualization object
            store.dispatch(
                setCurrentVis({ type: 'LINE_LIST', outputType: 'EVENT' })
            )
        )

        waitFor(() => {
            expect(screen.getByTestId('title-bar')).toBeInTheDocument()
            expect(
                screen.getByText('Unsaved visualization')
            ).toBeInTheDocument()
        })
    })

    it('should render the visualization title when looking at a saved visualization', async () => {
        const { store } = await renderWithAppWrapper(<TitleBar />)

        act(() =>
            store.dispatch(
                setSavedVis(
                    eventVisualization1 as unknown as SavedVisualization
                )
            )
        )

        act(() =>
            store.dispatch(
                setCurrentVis(
                    eventVisualization1 as unknown as SavedVisualization
                )
            )
        )

        waitFor(() => {
            expect(screen.getByTestId('title-bar')).toBeInTheDocument()
            expect(
                screen.getByText(eventVisualization1.name)
            ).toBeInTheDocument()
        })
    })

    it('should render the visualization title with the Edited label when editing a loaded visualization', async () => {
        const { store } = await renderWithAppWrapper(<TitleBar />)

        act(() =>
            store.dispatch(
                setSavedVis(
                    eventVisualization1 as unknown as SavedVisualization
                )
            )
        )

        act(() =>
            store.dispatch(
                setCurrentVis({
                    ...eventVisualization1,
                    outputType: 'ENROLLMENT',
                } as unknown as SavedVisualization)
            )
        )

        waitFor(() => {
            expect(screen.getByTestId('title-bar')).toBeInTheDocument()
            expect(
                screen.getByText(eventVisualization1.name)
            ).toBeInTheDocument()
            expect(screen.getByText('Edited')).toBeInTheDocument()
        })
    })
})
