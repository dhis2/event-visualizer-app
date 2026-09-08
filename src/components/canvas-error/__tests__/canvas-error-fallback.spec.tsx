import { FetchError } from '@dhis2/app-runtime'
import { EmptyResponseError } from '@modules/error/empty-response-error'
import { suppressWindowError } from '@test-utils/suppress-window-error'
import { render, screen } from '@testing-library/react'
import { Component, type PropsWithChildren } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { CanvasErrorFallback } from '../canvas-error-fallback'

class CatchAll extends Component<PropsWithChildren, { caught: boolean }> {
    state = { caught: false }
    static getDerivedStateFromError() {
        return { caught: true }
    }
    render() {
        return this.state.caught ? <div>bubbled</div> : this.props.children
    }
}

describe('CanvasErrorFallback', () => {
    it('renders a canvas error for a FetchError', () => {
        render(
            <CanvasErrorFallback
                error={new FetchError({ type: 'network', message: 'down' })}
                resetErrorBoundary={vi.fn()}
            />
        )

        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('renders the "No data available" screen for an EmptyResponseError', () => {
        render(
            <CanvasErrorFallback
                error={new EmptyResponseError()}
                resetErrorBoundary={vi.fn()}
            />
        )

        expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it(
        're-throws anything that is not a canvas error',
        suppressWindowError('boom', () => {
            render(
                <CatchAll>
                    <CanvasErrorFallback
                        error={new Error('boom')}
                        resetErrorBoundary={vi.fn()}
                    />
                </CatchAll>
            )

            expect(screen.getByText('bubbled')).toBeInTheDocument()
        })
    )
})
