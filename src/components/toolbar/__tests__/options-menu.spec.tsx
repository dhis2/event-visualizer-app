import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { OptionsMenu } from '../menu-bar/options-menu'
import { HoverMenuBar } from '@dhis2/analytics'
import { getDefaultOptions } from '@modules/options'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'

const defaultPartialStore = {
    preloadedState: {
        visUiConfig: {
            visualizationType: 'LINE_LIST' as const,
            outputType: 'EVENT' as const,
            layout: { columns: [], filters: [], rows: [] },
            itemsByDimension: {},
            conditionsByDimension: {},
            options: getDefaultOptions('COMMA'),
        },
    },
}

const pivotTablePartialStore = {
    preloadedState: {
        visUiConfig: {
            visualizationType: 'PIVOT_TABLE' as const,
            outputType: 'EVENT' as const,
            layout: { columns: [], filters: [], rows: [] },
            itemsByDimension: {},
            conditionsByDimension: {},
            options: getDefaultOptions('COMMA'),
        },
    },
}

describe('OptionsMenu', () => {
    it('renders the options menu trigger', async () => {
        await renderWithAppWrapper(
            <HoverMenuBar>
                <OptionsMenu />
            </HoverMenuBar>,
            { partialStore: defaultPartialStore }
        )

        expect(screen.getByText('Options')).toBeInTheDocument()
    })

    it('opens the menu when the options trigger is clicked', async () => {
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <HoverMenuBar>
                <OptionsMenu />
            </HoverMenuBar>,
            { partialStore: defaultPartialStore }
        )

        await user.click(screen.getByText('Options'))

        expect(screen.getByTestId('options-menu-list')).toBeInTheDocument()
        expect(screen.getByText('Data')).toBeInTheDocument()
        expect(screen.getByText('Style')).toBeInTheDocument()
        expect(screen.getByText('Legend')).toBeInTheDocument()
    })

    it('opens the modal when a menu item is clicked', async () => {
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <HoverMenuBar>
                <OptionsMenu />
            </HoverMenuBar>,
            { partialStore: defaultPartialStore }
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

    it('opens the modal with the correct active tab and content when clicking Data menu item', async () => {
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <HoverMenuBar>
                <OptionsMenu />
            </HoverMenuBar>,
            { partialStore: defaultPartialStore }
        )

        // Open the menu
        await user.click(screen.getByText('Options'))

        // Click the Data option
        await user.click(screen.getByText('Data'))

        expect(screen.getByTestId('options-modal')).toBeInTheDocument()
        // Check that the Data tab is selected (should have aria-selected="true")
        const dataTab = screen.getByRole('tab', { name: 'Data' })
        expect(dataTab).toHaveAttribute('aria-selected', 'true')
        // Check that the correct section content is rendered
        expect(screen.getByTestId('line-list-data-tab')).toBeInTheDocument()
    })

    it('opens the modal with the correct active tab and content when clicking Style menu item', async () => {
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <HoverMenuBar>
                <OptionsMenu />
            </HoverMenuBar>,
            { partialStore: defaultPartialStore }
        )

        // Open the menu
        await user.click(screen.getByText('Options'))

        // Click the Style option
        await user.click(screen.getByText('Style'))

        expect(screen.getByTestId('options-modal')).toBeInTheDocument()
        // Check that the Style tab is selected
        const styleTab = screen.getByRole('tab', { name: 'Style' })
        expect(styleTab).toHaveAttribute('aria-selected', 'true')
        // Check that the correct section content is rendered
        expect(screen.getByTestId('line-list-style-tab')).toBeInTheDocument()
    })

    it('allows switching tabs within the modal', async () => {
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <HoverMenuBar>
                <OptionsMenu />
            </HoverMenuBar>,
            { partialStore: defaultPartialStore }
        )

        // Open menu and click Data
        await user.click(screen.getByText('Options'))
        await user.click(screen.getByText('Data'))
        expect(screen.getByTestId('options-modal')).toBeInTheDocument()

        // Initially Data tab should be selected
        expect(screen.getByRole('tab', { name: 'Data' })).toHaveAttribute(
            'aria-selected',
            'true'
        )
        expect(screen.getByTestId('line-list-data-tab')).toBeInTheDocument()

        // Switch to Style tab
        await user.click(screen.getByRole('tab', { name: 'Style' }))
        expect(screen.getByRole('tab', { name: 'Style' })).toHaveAttribute(
            'aria-selected',
            'true'
        )
        expect(screen.getByTestId('line-list-style-tab')).toBeInTheDocument()

        // Switch to Legend tab
        await user.click(screen.getByRole('tab', { name: 'Legend' }))
        expect(screen.getByRole('tab', { name: 'Legend' })).toHaveAttribute(
            'aria-selected',
            'true'
        )
        expect(screen.getByTestId('line-list-legend-tab')).toBeInTheDocument()
    })

    it('closes the modal when cancel button is clicked', async () => {
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <HoverMenuBar>
                <OptionsMenu />
            </HoverMenuBar>,
            { partialStore: defaultPartialStore }
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

    it('works with different visualization types', async () => {
        const user = userEvent.setup()

        await renderWithAppWrapper(
            <HoverMenuBar>
                <OptionsMenu />
            </HoverMenuBar>,
            { partialStore: pivotTablePartialStore }
        )

        // Open menu
        await user.click(screen.getByText('Options'))

        expect(screen.getByTestId('options-menu-list')).toBeInTheDocument()
        expect(screen.getByText('Data')).toBeInTheDocument()
        expect(screen.getByText('Style')).toBeInTheDocument()

        // Open modal by clicking Data
        await user.click(screen.getByText('Data'))
        expect(screen.getByTestId('options-modal')).toBeInTheDocument()

        // Data tab should be selected and show pivot table data section
        expect(screen.getByRole('tab', { name: 'Data' })).toHaveAttribute(
            'aria-selected',
            'true'
        )
        expect(screen.getByTestId('pivot-table-data-tab')).toBeInTheDocument()

        // Switch to Style tab
        await user.click(screen.getByRole('tab', { name: 'Style' }))
        expect(screen.getByRole('tab', { name: 'Style' })).toHaveAttribute(
            'aria-selected',
            'true'
        )
        expect(screen.getByTestId('pivot-table-style-tab')).toBeInTheDocument()
    })
})
