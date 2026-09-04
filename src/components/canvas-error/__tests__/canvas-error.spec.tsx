import type { EngineError } from '@api/parse-engine-error'
import { EmptyResponseError } from '@modules/error/empty-response-error'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CanvasError } from '../canvas-error'

const networkError: EngineError = { type: 'network', message: 'x' }

describe('CanvasError', () => {
    it('shows a Retry button for a retryable error when onRetry is provided', () => {
        render(<CanvasError error={networkError} onRetry={vi.fn()} />)

        expect(
            screen.getByRole('button', { name: 'Retry' })
        ).toBeInTheDocument()
    })

    it('shows no Retry button for the empty "No data" state', () => {
        render(
            <CanvasError error={new EmptyResponseError()} onRetry={vi.fn()} />
        )

        expect(screen.getByText('No data')).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Retry' })
        ).not.toBeInTheDocument()
    })

    it('shows no Retry button when onRetry is missing', () => {
        render(<CanvasError error={networkError} />)

        expect(
            screen.queryByRole('button', { name: 'Retry' })
        ).not.toBeInTheDocument()
    })
})
