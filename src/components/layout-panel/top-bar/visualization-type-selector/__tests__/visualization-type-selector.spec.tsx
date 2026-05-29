import {
    getVisUiConfigLayout,
    getVisUiConfigVisualizationType,
    setVisUiConfigLayout,
} from '@store/vis-ui-config-slice'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { VisualizationTypeSelector } from '../visualization-type-selector'

const openDropdown = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByTestId('visualization-type-selector-button'))
}

const numericDataElement = {
    id: 'numericDe',
    name: 'Numeric DE',
    dimensionId: 'numericDe',
    dimensionType: 'DATA_ELEMENT' as const,
    valueType: 'NUMBER' as const,
}

const programIndicator = {
    id: 'pi',
    name: 'My PI',
    dimensionId: 'pi',
    dimensionType: 'PROGRAM_INDICATOR' as const,
}

describe('VisualizationTypeSelector', () => {
    it('renders the Line list item by default', async () => {
        await renderWithAppWrapper(<VisualizationTypeSelector />)

        expect(screen.getByText('Line list')).toBeInTheDocument()
    })

    it('opens the dropdown on click', async () => {
        const user = userEvent.setup()

        await renderWithAppWrapper(<VisualizationTypeSelector />)

        await openDropdown(user)

        const modal = screen.getByTestId('visualization-type-selector-list')
        expect(modal).toBeInTheDocument()
        expect(within(modal).getByText('Line list')).toBeInTheDocument()
        expect(within(modal).getByText('Pivot table')).toBeInTheDocument()
    })

    it('changes vis type directly when nothing is discarded', async () => {
        const user = userEvent.setup()

        const { store } = await renderWithAppWrapper(
            <VisualizationTypeSelector />,
            {
                metadata: { numericDe: numericDataElement },
            }
        )

        act(() => {
            store.dispatch(
                setVisUiConfigLayout({
                    columns: ['numericDe'],
                    rows: [],
                    filters: [],
                })
            )
        })

        await openDropdown(user)
        await user.click(
            within(
                screen.getByTestId('visualization-type-selector-list')
            ).getByText('Pivot table')
        )

        expect(
            screen.queryByTestId('conversion-confirmation-modal')
        ).not.toBeInTheDocument()
        expect(getVisUiConfigVisualizationType(store.getState())).toBe(
            'PIVOT_TABLE'
        )
        expect(getVisUiConfigLayout(store.getState())).toEqual({
            columns: ['numericDe'],
            rows: [],
            filters: [],
        })
    })

    it('opens the confirmation modal when dimensions would be discarded, applies on Convert', async () => {
        const user = userEvent.setup()

        const { store } = await renderWithAppWrapper(
            <VisualizationTypeSelector />,
            {
                metadata: {
                    numericDe: numericDataElement,
                    pi: programIndicator,
                },
            }
        )

        act(() => {
            store.dispatch(
                setVisUiConfigLayout({
                    columns: ['pi', 'numericDe'],
                    rows: [],
                    filters: [],
                })
            )
        })

        await openDropdown(user)
        await user.click(
            within(
                screen.getByTestId('visualization-type-selector-list')
            ).getByText('Pivot table')
        )

        const modal = await screen.findByTestId('conversion-confirmation-modal')
        expect(within(modal).getByText(/My PI/)).toBeInTheDocument()
        expect(getVisUiConfigVisualizationType(store.getState())).toBe(
            'LINE_LIST'
        )

        await user.click(within(modal).getByText('Convert'))

        expect(
            screen.queryByTestId('conversion-confirmation-modal')
        ).not.toBeInTheDocument()
        expect(getVisUiConfigVisualizationType(store.getState())).toBe(
            'PIVOT_TABLE'
        )
        expect(getVisUiConfigLayout(store.getState())).toEqual({
            columns: ['numericDe'],
            rows: [],
            filters: [],
        })
    })

    it('leaves state unchanged when the confirmation modal is cancelled', async () => {
        const user = userEvent.setup()

        const { store } = await renderWithAppWrapper(
            <VisualizationTypeSelector />,
            {
                metadata: {
                    numericDe: numericDataElement,
                    pi: programIndicator,
                },
            }
        )

        const initialLayout = {
            columns: ['pi', 'numericDe'],
            rows: [],
            filters: [],
        }
        act(() => {
            store.dispatch(setVisUiConfigLayout(initialLayout))
        })

        await openDropdown(user)
        await user.click(
            within(
                screen.getByTestId('visualization-type-selector-list')
            ).getByText('Pivot table')
        )

        const modal = await screen.findByTestId('conversion-confirmation-modal')
        await user.click(within(modal).getByText('Cancel'))

        expect(
            screen.queryByTestId('conversion-confirmation-modal')
        ).not.toBeInTheDocument()
        expect(getVisUiConfigVisualizationType(store.getState())).toBe(
            'LINE_LIST'
        )
        expect(getVisUiConfigLayout(store.getState())).toEqual(initialLayout)
    })
})
