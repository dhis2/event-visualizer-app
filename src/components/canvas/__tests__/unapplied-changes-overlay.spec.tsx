import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { UnappliedChangesOverlay } from '../unapplied-changes-overlay'

const renderOverlay = (
    props: Partial<{
        hasUnappliedChanges: boolean
        isVisualizationLoading: boolean
    }> = {}
) =>
    render(
        <UnappliedChangesOverlay
            hasUnappliedChanges={false}
            isVisualizationLoading={false}
            {...props}
        >
            <div data-test="canvas-content" />
        </UnappliedChangesOverlay>
    )

/* The notice stays mounted so it can fade out, so "hidden" is the aria-hidden
 * state rather than the absence of the element. */
const getNotice = () => screen.getByTestId('unapplied-changes')

describe('UnappliedChangesOverlay', () => {
    it('renders its children', () => {
        renderOverlay()

        expect(screen.getByTestId('canvas-content')).toBeInTheDocument()
    })

    it('hides the notice when there are no unapplied changes', () => {
        renderOverlay()

        expect(getNotice()).toHaveAttribute('aria-hidden', 'true')
    })

    it('shows the notice when there are unapplied changes', () => {
        renderOverlay({ hasUnappliedChanges: true })

        expect(getNotice()).toHaveAttribute('aria-hidden', 'false')
        expect(getNotice()).toHaveTextContent('Changes not applied')
    })

    it('hides the notice while the visualization is loading', () => {
        renderOverlay({
            hasUnappliedChanges: true,
            isVisualizationLoading: true,
        })

        expect(getNotice()).toHaveAttribute('aria-hidden', 'true')
    })
})
