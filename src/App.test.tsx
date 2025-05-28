import { CustomDataProvider } from '@dhis2/app-runtime'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { describe, it, expect } from 'vitest'
import App from './App'

const customData = {
    me: {
        name: 'John Doe',
        username: 'john_doe',
        settings: {
            keyUiLocale: 'en',
        },
        authorities: ['ALL'],
    },
}

describe('App', () => {
    it('renders correctly', async () => {
        render(
            <CustomDataProvider data={customData}>
                <App />
            </CustomDataProvider>
        )

        waitFor(() => {
            const element = screen.getByText('Hello John Doe')
            expect(element).toBeInTheDocument()
        })
    })
})
