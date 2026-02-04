import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ToggleCollapseAllButton } from '../toggle-collapse-all-button'
import { useAppDispatch, useAppSelector } from '@hooks'

vi.mock('@hooks', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}))

describe('ToggleCollapseAllButton', () => {
    const mockUseAppDispatch = vi.mocked(useAppDispatch)
    const mockUseAppSelector = vi.mocked(useAppSelector)
    const mockDispatch = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        mockUseAppDispatch.mockReturnValue(mockDispatch)
        mockUseAppSelector.mockReturnValue(false)
    })

    it('renders the toggle button', () => {
        render(<ToggleCollapseAllButton />)

        const button = screen.getByTestId('toggle-collapse-all-button')
        expect(button).toBeInTheDocument()
    })

    it('renders collapse icon when all groups are expanded', () => {
        mockUseAppSelector.mockReturnValue(false)

        render(<ToggleCollapseAllButton />)

        const collapseIcon = screen.getByTestId(
            'toggle-collapse-all-button-icon-collapse'
        )
        expect(collapseIcon).toBeInTheDocument()
    })

    it('renders expand icon when all groups are collapsed', () => {
        mockUseAppSelector.mockReturnValue(true)

        render(<ToggleCollapseAllButton />)

        const expandIcon = screen.getByTestId(
            'toggle-collapse-all-button-icon-expand'
        )
        expect(expandIcon).toBeInTheDocument()
    })

    it('has correct title when all groups are expanded', () => {
        mockUseAppSelector.mockReturnValue(false)

        render(<ToggleCollapseAllButton />)

        const button = screen.getByTestId('toggle-collapse-all-button')
        expect(button).toHaveAttribute('title', 'Collapse all cards')
    })

    it('has correct title when all groups are collapsed', () => {
        mockUseAppSelector.mockReturnValue(true)

        render(<ToggleCollapseAllButton />)

        const button = screen.getByTestId('toggle-collapse-all-button')
        expect(button).toHaveAttribute('title', 'Expand all cards')
    })

    it('calls dispatch when clicked', async () => {
        const user = userEvent.setup()
        render(<ToggleCollapseAllButton />)

        const button = screen.getByTestId('toggle-collapse-all-button')
        await user.click(button)

        expect(mockDispatch).toHaveBeenCalledTimes(1)
    })
})
