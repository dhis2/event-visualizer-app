import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, it, expect } from 'vitest'
import Hello from './Hello'

describe('Hello', () => {
    it('displays the name', () => {
        render(<Hello name="John" />)

        screen.debug() // Logs the DOM structure
        const element = screen.getByText('Hello John')
        expect(element).toBeInTheDocument()
    })
    it('displays the fallback name', () => {
        render(<Hello />)

        screen.debug() // Logs the DOM structure
        const element = screen.getByText('Hello Unknown Visitor')
        expect(element).toBeInTheDocument()
    })
})
