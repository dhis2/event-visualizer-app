import { screen, waitFor, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { OptionsMenu } from '../menu-bar/options-menu'
import { HoverMenuBar } from '@dhis2/analytics'
import { useAppSelector } from '@hooks'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'

// Mock the hooks
vi.mock('@hooks', () => ({
    useAppSelector: vi.fn(),
}))

vi.mock('@store/vis-ui-config-slice', () => ({
    getVisUiConfigVisualizationType: vi.fn(),
}))

const mockUseAppSelector = vi.mocked(useAppSelector)
const mockGetVisUiConfigVisualizationType = vi.mocked(
    getVisUiConfigVisualizationType
)

describe('OptionsMenu', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetVisUiConfigVisualizationType.mockReturnValue('LINE_LIST')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseAppSelector.mockImplementation((selector) => selector({} as any))
    })

    it('renders the options menu trigger', () => {
        render(
            <HoverMenuBar>
                <OptionsMenu />
            </HoverMenuBar>
        )

        expect(screen.getByText('Options')).toBeInTheDocument()
    })

    it('opens the menu when the options trigger is clicked', async () => {
        const user = userEvent.setup()
        render(
            <HoverMenuBar>
                <OptionsMenu />
            </HoverMenuBar>
        )

        await user.click(screen.getByText('Options'))

        expect(screen.getByTestId('options-menu-list')).toBeInTheDocument()
        expect(screen.getByText('Data')).toBeInTheDocument()
        expect(screen.getByText('Style')).toBeInTheDocument()
        expect(screen.getByText('Legend')).toBeInTheDocument()
    })

    it('opens the modal when a menu item is clicked', async () => {
        const user = userEvent.setup()
        render(
            <HoverMenuBar>
                <OptionsMenu />
            </HoverMenuBar>
        )

        // Open the menu
        await user.click(screen.getByText('Options'))

        // Click the Data option
        await user.click(screen.getByText('Data'))

        expect(screen.getByTestId('options-modal')).toBeInTheDocument()
        expect(screen.getByTestId('options-modal-tab-bar')).toBeInTheDocument()
        // Check that Data tab is selected (first tab)
        const dataTab = screen.getByText('Data')
        expect(dataTab).toBeInTheDocument()
    })

    it('closes the modal when cancel button is clicked', async () => {
        const user = userEvent.setup()
        render(
            <HoverMenuBar>
                <OptionsMenu />
            </HoverMenuBar>
        )

        // Open menu and modal
        await user.click(screen.getByText('Options'))
        await user.click(screen.getByText('Data'))
        expect(screen.getByTestId('options-modal')).toBeInTheDocument()

        // Close modal
        await user.click(screen.getByTestId('options-modal-action-cancel'))

        await waitFor(() => {
            expect(
                screen.queryByTestId('options-modal')
            ).not.toBeInTheDocument()
        })
    })

    it('allows switching between different options', async () => {
        const user = userEvent.setup()
        render(
            <HoverMenuBar>
                <OptionsMenu />
            </HoverMenuBar>
        )

        // Open menu and click Data
        await user.click(screen.getByText('Options'))
        await user.click(screen.getByText('Data'))
        expect(screen.getByTestId('options-modal')).toBeInTheDocument()

        // Switch to Style tab
        await user.click(screen.getByText('Style'))
        expect(screen.getByTestId('options-modal')).toBeInTheDocument()
    })

    it('works with different visualization types', async () => {
        const user = userEvent.setup()

        // Test with PIVOT_TABLE
        mockGetVisUiConfigVisualizationType.mockReturnValue('PIVOT_TABLE')

        render(
            <HoverMenuBar>
                <OptionsMenu />
            </HoverMenuBar>
        )

        // Open menu
        await user.click(screen.getByText('Options'))

        expect(screen.getByTestId('options-menu-list')).toBeInTheDocument()
        expect(screen.getByText('Data')).toBeInTheDocument()
        expect(screen.getByText('Style')).toBeInTheDocument()
        expect(screen.getByText('Legend')).toBeInTheDocument()

        // Open modal
        await user.click(screen.getByText('Data'))
        expect(screen.getByTestId('options-modal')).toBeInTheDocument()
    })
})
