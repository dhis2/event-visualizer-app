import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FilterDropdownButton } from '../filter-dropdown-button'
import { useAppDispatch, useAppSelector } from '@hooks'
import { clearFilter, setFilter } from '@store/dimensions-selection-slice'

vi.mock('@hooks', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}))

vi.mock('@store/dimensions-selection-slice', () => ({
    clearFilter: vi.fn(),
    setFilter: vi.fn(),
    getFilter: vi.fn(),
}))

describe('FilterDropdownButton', () => {
    const mockUseAppDispatch = vi.mocked(useAppDispatch)
    const mockUseAppSelector = vi.mocked(useAppSelector)
    const mockDispatch = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        mockUseAppDispatch.mockReturnValue(mockDispatch)
        mockUseAppSelector.mockReturnValue(null)
    })

    it('renders the filter button with default text when no filter is active', () => {
        render(<FilterDropdownButton />)

        const button = screen.getByTestId('filter-dropdown-button')
        expect(button).toBeInTheDocument()
        expect(button).toHaveTextContent('Filter')
    })

    it('does not show clear button when no filter is active', () => {
        render(<FilterDropdownButton />)

        const clearButton = screen.queryByTestId('filter-clear-button')
        expect(clearButton).not.toBeInTheDocument()
    })

    it('renders with active filter label', () => {
        mockUseAppSelector.mockReturnValue('ORGANISATION_UNIT')

        render(<FilterDropdownButton />)

        const button = screen.getByTestId('filter-dropdown-button')
        expect(button).toHaveTextContent('Org units')
    })

    it('shows clear button when filter is active', () => {
        mockUseAppSelector.mockReturnValue('PERIOD')

        render(<FilterDropdownButton />)

        const clearButton = screen.getByTestId('filter-clear-button')
        expect(clearButton).toBeInTheDocument()
    })

    it('applies withSelection class when filter is active', () => {
        mockUseAppSelector.mockReturnValue('PERIODS')

        render(<FilterDropdownButton />)

        const button = screen.getByTestId('filter-dropdown-button')
        expect(button.className).toMatch(/withSelection/)
    })

    it('applies withBoxShadow class to wrapper when filter is active', () => {
        mockUseAppSelector.mockReturnValue('PERIODS')

        render(<FilterDropdownButton />)

        const wrapper = screen.getByTestId('filter-dropdown-button-wrap')
        expect(wrapper.className).toMatch(/withBoxShadow/)
    })

    it('opens menu when button is clicked', async () => {
        const user = userEvent.setup()
        render(<FilterDropdownButton />)

        const button = screen.getByTestId('filter-dropdown-button')
        await user.click(button)

        // Check that all filter options are visible
        expect(screen.getByText('Org units')).toBeInTheDocument()
        expect(screen.getByText('Periods')).toBeInTheDocument()
        expect(screen.getByText('Statuses')).toBeInTheDocument()
        expect(screen.getByText('Data elements')).toBeInTheDocument()
        expect(screen.getByText('Program attributes')).toBeInTheDocument()
        expect(screen.getByText('Program indicators')).toBeInTheDocument()
        expect(screen.getByText('Categories')).toBeInTheDocument()
        expect(
            screen.getByText('Category option group sets')
        ).toBeInTheDocument()
    })

    it('closes menu when backdrop is clicked', async () => {
        const user = userEvent.setup()
        render(<FilterDropdownButton />)

        // Open menu
        const button = screen.getByTestId('filter-dropdown-button')
        await user.click(button)

        expect(screen.getByTestId('filter-dropdown-menu')).toBeInTheDocument()

        // Click backdrop
        const backdropLayer = screen.getByTestId('filter-dropdown-backdrop')
        const backdrop = backdropLayer.querySelector('.backdrop')!
        await user.click(backdrop)

        // Menu should be closed
        expect(
            screen.queryByTestId('filter-dropdown-menu')
        ).not.toBeInTheDocument()
    })

    it('dispatches setFilter action when a filter option is selected', async () => {
        const user = userEvent.setup()
        render(<FilterDropdownButton />)

        // Open menu
        const button = screen.getByTestId('filter-dropdown-button')
        await user.click(button)

        // Click on a filter option
        const orgUnitsOption = screen.getByText('Org units')
        await user.click(orgUnitsOption)

        expect(mockDispatch).toHaveBeenCalledTimes(1)
        expect(setFilter).toHaveBeenCalledWith('ORGANISATION_UNIT')
    })

    it('closes menu after selecting a filter option', async () => {
        const user = userEvent.setup()
        render(<FilterDropdownButton />)

        // Open menu
        const button = screen.getByTestId('filter-dropdown-button')
        await user.click(button)

        expect(screen.getByTestId('filter-dropdown-menu')).toBeInTheDocument()

        // Click on a filter option
        await user.click(screen.getByText('Periods'))

        // Menu should be closed
        expect(
            screen.queryByTestId('filter-dropdown-menu')
        ).not.toBeInTheDocument()
    })

    it('dispatches clearFilter action when clear button is clicked', async () => {
        const user = userEvent.setup()
        mockUseAppSelector.mockReturnValue('STATUSES')

        render(<FilterDropdownButton />)

        const clearButton = screen.getByTestId('filter-clear-button')
        await user.click(clearButton)

        expect(mockDispatch).toHaveBeenCalledWith(clearFilter())
    })

    it('marks the active filter in the menu', async () => {
        const user = userEvent.setup()
        mockUseAppSelector.mockReturnValue('DATA_ELEMENT')

        render(<FilterDropdownButton />)

        // Open menu
        const button = screen.getByTestId('filter-dropdown-button')
        await user.click(button)

        const activeMenuItem = screen.getByTestId(
            'filter-menu-item-DATA_ELEMENT'
        )
        // Check that the active prop is set (DHIS2 UI applies special styling)
        expect(activeMenuItem).toBeInTheDocument()
    })

    it('renders all filter options with correct labels', async () => {
        const user = userEvent.setup()
        render(<FilterDropdownButton />)

        const button = screen.getByTestId('filter-dropdown-button')
        await user.click(button)

        const expectedFilters = [
            { key: 'ORGANISATION_UNIT', label: 'Org units' },
            { key: 'PERIOD', label: 'Periods' },
            { key: 'STATUS', label: 'Statuses' },
            { key: 'DATA_ELEMENT', label: 'Data elements' },
            { key: 'PROGRAM_ATTRIBUTE', label: 'Program attributes' },
            { key: 'PROGRAM_INDICATOR', label: 'Program indicators' },
            { key: 'CATEGORY', label: 'Categories' },
            {
                key: 'CATEGORY_OPTION_GROUP_SET',
                label: 'Category option group sets',
            },
        ]

        expectedFilters.forEach(({ key, label }) => {
            const menuItem = screen.getByTestId(`filter-menu-item-${key}`)
            expect(within(menuItem).getByText(label)).toBeInTheDocument()
        })
    })
})
