import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, it, expect } from 'vitest'
import App from './app'
import { useRtkQuery } from './hooks'
import { createUseRtkQueryMockReturnValue } from './test-utils'

vi.mock('./hooks', async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import('./hooks')>()),
        useRtkQuery: vi.fn(),
        useSystemSettings: vi.fn(() => ({})),
    }
})
vi.mock('./app-wrapper', () => ({
    AppWrapper: ({ children }) => children,
}))

describe('App', () => {
    it('renders correctly', async () => {
        vi.mocked(useRtkQuery).mockReturnValue(
            createUseRtkQueryMockReturnValue({
                data: { name: 'John Doe' },
            })
        )
        render(<App />)

        const element = screen.getByText('Hello John Doe')
        expect(element).toBeInTheDocument()
    })
})
