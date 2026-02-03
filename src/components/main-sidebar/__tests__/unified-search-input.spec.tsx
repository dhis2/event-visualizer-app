import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { UnifiedSearchInput } from '../unified-search-input'
import { useAppSelector, useAppStore } from '@hooks'
import type { AppStore } from '@store/store'

vi.mock('@hooks', () => ({
    useAppSelector: vi.fn(),
    useAppStore: vi.fn(),
}))

describe('UnifiedSearchInput', () => {
    const mockUseAppSelector = vi.mocked(useAppSelector)
    const mockUseAppStore = vi.mocked(useAppStore)
    const mockDispatch = vi.fn()
    const mockGetState = vi.fn()

    // Helper to setup useAppSelector mock for each render
    // The component calls useAppSelector twice per render:
    // 1st: isAnyListLoading -> returns boolean
    // 2nd: getAllListLoadErrors -> returns array
    const setupSelectorMock = (isLoading: boolean, errors: unknown[] = []) => {
        let callCount = 0
        mockUseAppSelector.mockImplementation(() => {
            callCount++
            if (callCount % 2 === 1) {
                // Odd calls: isLoading
                return isLoading
            } else {
                // Even calls: errors
                return errors
            }
        })
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()

        // Default: return an initial state with empty search term
        mockGetState.mockReturnValue({
            dimensionSelection: {
                searchTerm: '',
            },
        })

        // Setup mock store
        mockUseAppStore.mockReturnValue({
            getState: mockGetState,
            dispatch: mockDispatch,
        } as unknown as AppStore)

        // Default: not loading, no errors
        setupSelectorMock(false, [])
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should render the search input', () => {
        render(<UnifiedSearchInput />)

        const input = screen.getByTestId('unified-search-input')
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('type', 'search')
        expect(input).toHaveAttribute('placeholder', 'Search')
    })

    it('should initialize with search term from store', () => {
        mockGetState.mockReturnValue({
            dimensionSelection: {
                searchTerm: 'initial search',
            },
        })

        render(<UnifiedSearchInput />)

        const input = screen.getByTestId(
            'unified-search-input'
        ) as HTMLInputElement
        expect(input.value).toBe('initial search')
    })

    it('should dispatch search term to store after 250ms debounce', () => {
        render(<UnifiedSearchInput />)

        const input = screen.getByTestId('unified-search-input')

        // Type a search term using fireEvent (not userEvent to avoid timer conflicts)
        act(() => {
            fireEvent.change(input, { target: { value: 'test' } })
        })

        // Should not dispatch immediately
        expect(mockDispatch).not.toHaveBeenCalled()

        // Fast-forward 249ms - should still not dispatch
        act(() => {
            vi.advanceTimersByTime(249)
        })
        expect(mockDispatch).not.toHaveBeenCalled()

        // Fast-forward 1ms more (total 250ms) - should dispatch
        act(() => {
            vi.advanceTimersByTime(1)
        })
        expect(mockDispatch).toHaveBeenCalledTimes(1)
        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: expect.stringContaining('setSearchTerm'),
                payload: 'test',
            })
        )
    })

    it('should not dispatch when search term is invalid (only 1 character)', () => {
        render(<UnifiedSearchInput />)

        const input = screen.getByTestId('unified-search-input')

        // Type a single character
        act(() => {
            fireEvent.change(input, { target: { value: 'a' } })
        })

        // Fast-forward past debounce time
        act(() => {
            vi.advanceTimersByTime(250)
        })

        // Should not dispatch because the term is too short
        expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('should dispatch when search term is cleared (empty string is valid)', () => {
        // Start with an existing search term
        mockGetState.mockReturnValue({
            dimensionSelection: {
                searchTerm: 'existing',
            },
        })

        render(<UnifiedSearchInput />)

        const input = screen.getByTestId('unified-search-input')

        // Clear the search
        act(() => {
            fireEvent.change(input, { target: { value: '' } })
        })

        // Fast-forward past debounce time
        act(() => {
            vi.advanceTimersByTime(250)
        })

        // Should dispatch with empty string
        expect(mockDispatch).toHaveBeenCalledTimes(1)
        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: expect.stringContaining('setSearchTerm'),
                payload: '',
            })
        )
    })

    it('should not dispatch if search term matches current store value', () => {
        render(<UnifiedSearchInput />)

        const input = screen.getByTestId('unified-search-input')

        // Type '123'
        act(() => {
            fireEvent.change(input, { target: { value: '123' } })
        })

        // Fast-forward past debounce time - should dispatch
        act(() => {
            vi.advanceTimersByTime(250)
        })
        expect(mockDispatch).toHaveBeenCalledTimes(1)
        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: '123',
            })
        )

        // Simulate store update after dispatch (in real app, reducer would do this)
        mockGetState.mockReturnValue({
            dimensionSelection: {
                searchTerm: '123',
            },
        })

        // Type '1234'
        act(() => {
            fireEvent.change(input, { target: { value: '1234' } })
        })

        // Fast-forward but not past debounce time
        act(() => {
            vi.advanceTimersByTime(125)
        })

        // Before debounce elapses, change back to '123'
        act(() => {
            fireEvent.change(input, { target: { value: '123' } })
        })

        // Fast-forward past debounce time
        act(() => {
            vi.advanceTimersByTime(250)
        })

        // Should still only have 1 dispatch (no second dispatch because value matches store)
        expect(mockDispatch).toHaveBeenCalledTimes(1)
    })

    describe('help message', () => {
        it('should show help message after 2000ms when entering 1 character', () => {
            render(<UnifiedSearchInput />)

            const input = screen.getByTestId('unified-search-input')

            // Type a single character
            act(() => {
                fireEvent.change(input, { target: { value: 'a' } })
            })

            // Should not show help message immediately
            expect(
                screen.queryByTestId('search-help-message')
            ).not.toBeInTheDocument()

            // Fast-forward 1999ms - should still not show
            act(() => {
                vi.advanceTimersByTime(1999)
            })
            expect(
                screen.queryByTestId('search-help-message')
            ).not.toBeInTheDocument()

            // Fast-forward 1ms more (total 2000ms) - should show
            act(() => {
                vi.advanceTimersByTime(1)
            })
            expect(
                screen.getByTestId('search-help-message')
            ).toBeInTheDocument()
            expect(screen.getByTestId('search-help-message')).toHaveTextContent(
                'Enter at least 2 characters to search'
            )
        })

        it('should clear help message immediately when typing becomes valid again', () => {
            render(<UnifiedSearchInput />)

            const input = screen.getByTestId('unified-search-input')

            // Type a single character
            fireEvent.change(input, { target: { value: 'a' } })

            // Fast-forward to show help message
            act(() => {
                vi.advanceTimersByTime(2000)
            })
            expect(
                screen.getByTestId('search-help-message')
            ).toBeInTheDocument()

            // Type another character to make it valid (2 chars)
            fireEvent.change(input, { target: { value: 'ab' } })

            // Help message should disappear immediately (no debounce)
            expect(
                screen.queryByTestId('search-help-message')
            ).not.toBeInTheDocument()
        })

        it('should clear help message immediately when clearing input', () => {
            render(<UnifiedSearchInput />)

            const input = screen.getByTestId('unified-search-input')

            // Type a single character
            act(() => {
                fireEvent.change(input, { target: { value: 'a' } })
            })

            // Fast-forward to show help message
            act(() => {
                vi.advanceTimersByTime(2000)
            })
            expect(
                screen.getByTestId('search-help-message')
            ).toBeInTheDocument()

            // Clear the input (empty is valid)
            act(() => {
                fireEvent.change(input, { target: { value: '' } })
            })

            // Help message should disappear immediately
            expect(
                screen.queryByTestId('search-help-message')
            ).not.toBeInTheDocument()
        })

        it('should cancel pending help message when input becomes valid before timeout', () => {
            render(<UnifiedSearchInput />)

            const input = screen.getByTestId('unified-search-input')

            // Type a single character
            act(() => {
                fireEvent.change(input, { target: { value: 'a' } })
            })

            // Fast-forward partway (1000ms)
            act(() => {
                vi.advanceTimersByTime(1000)
            })

            // Make it valid before help message would show
            act(() => {
                fireEvent.change(input, { target: { value: 'ab' } })
            })

            // Fast-forward past original 2000ms
            act(() => {
                vi.advanceTimersByTime(1500)
            })

            // Help message should never have appeared
            expect(
                screen.queryByTestId('search-help-message')
            ).not.toBeInTheDocument()
        })
    })

    describe('loading state', () => {
        it('should show loader after 250ms when loading changes to true', () => {
            setupSelectorMock(false, [])

            const { rerender } = render(<UnifiedSearchInput />)

            // Should not show loader initially
            expect(
                screen.queryByTestId('search-loader')
            ).not.toBeInTheDocument()

            // Change loading state to true
            setupSelectorMock(true, [])
            rerender(<UnifiedSearchInput />)

            // Should not show loader immediately
            expect(
                screen.queryByTestId('search-loader')
            ).not.toBeInTheDocument()

            // Fast-forward 249ms - should still not show
            act(() => {
                vi.advanceTimersByTime(249)
            })
            expect(
                screen.queryByTestId('search-loader')
            ).not.toBeInTheDocument()

            // Fast-forward 1ms more (total 250ms) - should show
            act(() => {
                vi.advanceTimersByTime(1)
            })
            expect(screen.getByTestId('search-loader')).toBeInTheDocument()
        })

        it('should hide loader after 250ms when loading changes to false', () => {
            setupSelectorMock(true, [])

            const { rerender } = render(<UnifiedSearchInput />)

            // Fast-forward to show the loader
            act(() => {
                vi.advanceTimersByTime(250)
            })
            expect(screen.getByTestId('search-loader')).toBeInTheDocument()

            // Change loading state to false
            setupSelectorMock(false, [])
            rerender(<UnifiedSearchInput />)

            // Loader should still be visible (debounced)
            expect(screen.getByTestId('search-loader')).toBeInTheDocument()

            // Fast-forward 249ms - should still show
            act(() => {
                vi.advanceTimersByTime(249)
            })
            expect(screen.getByTestId('search-loader')).toBeInTheDocument()

            // Fast-forward 1ms more (total 250ms) - should hide
            act(() => {
                vi.advanceTimersByTime(1)
            })
            expect(
                screen.queryByTestId('search-loader')
            ).not.toBeInTheDocument()
        })

        it('should add loading class to input when loader is shown', () => {
            setupSelectorMock(true, [])

            render(<UnifiedSearchInput />)

            const input = screen.getByTestId('unified-search-input')

            // Fast-forward to show the loader
            act(() => {
                vi.advanceTimersByTime(250)
            })

            // CSS modules hash class names, so we check if the class attribute contains 'loading'
            expect(input.className).toContain('loading')
        })
    })

    describe('error state', () => {
        const assertError = (msg: string) => {
            expect(screen.getByTestId('search-error-icon')).toBeInTheDocument()
            expect(
                screen.getByTestId('search-error-message')
            ).toBeInTheDocument()
            expect(
                screen.getByTestId('search-error-message')
            ).toHaveTextContent(msg)
        }

        it('should show error icon and message when there is an error', () => {
            const mockError = { type: 'network', message: 'Network error' }
            setupSelectorMock(false, [mockError])

            render(<UnifiedSearchInput />)

            assertError('Something went wrong while searching.')
        })

        it('should show same error message when there are multiple errors', () => {
            const mockErrors = [
                { type: 'network', message: 'Network error' },
                { type: 'timeout', message: 'Timeout' },
            ]
            setupSelectorMock(false, mockErrors)

            render(<UnifiedSearchInput />)

            assertError('Something went wrong while searching.')
        })

        it('should add error class to input when there is an error', () => {
            const mockError = { type: 'network', message: 'Network error' }
            setupSelectorMock(false, [mockError])

            render(<UnifiedSearchInput />)

            const input = screen.getByTestId('unified-search-input')
            // CSS modules hash class names, so we check if the class attribute contains 'error'
            expect(input.className).toContain('error')
        })

        it('should set aria-describedby with error id when there is an error', () => {
            const mockError = { type: 'network', message: 'Network error' }
            setupSelectorMock(false, [mockError])

            render(<UnifiedSearchInput />)

            const input = screen.getByTestId('unified-search-input')
            expect(input).toHaveAttribute(
                'aria-describedby',
                expect.stringContaining('search-error')
            )
        })
    })

    describe('accessibility', () => {
        it('should set aria-describedby when both error and help message are shown', () => {
            const mockError = { type: 'network', message: 'Network error' }
            setupSelectorMock(false, [mockError])

            render(<UnifiedSearchInput />)

            const input = screen.getByTestId('unified-search-input')

            // Type a single character to trigger help message
            fireEvent.change(input, { target: { value: 'a' } })

            // Fast-forward to show help message
            act(() => {
                vi.advanceTimersByTime(2000)
            })

            // Should have both IDs in aria-describedby
            const describedBy = input.getAttribute('aria-describedby')
            expect(describedBy).toContain('search-error')
            expect(describedBy).toContain('search-help')
        })

        it('should not have aria-describedby when no error or help message', () => {
            setupSelectorMock(false, [])

            render(<UnifiedSearchInput />)

            const input = screen.getByTestId('unified-search-input')
            expect(input).not.toHaveAttribute('aria-describedby')
        })
    })
})
