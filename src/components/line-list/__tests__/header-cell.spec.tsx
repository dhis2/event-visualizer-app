import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { HeaderCell } from '../header-cell'

// Wrapper component to provide proper table structure
const TableWrapper = ({ children }: { children: React.ReactNode }) => (
    <table>
        <thead>
            <tr>{children}</tr>
        </thead>
    </table>
)

describe('HeaderCell - Sort Direction Mapping', () => {
    const baseProps = {
        name: 'ouname',
        dimensionId: 'ou',
        displayText: 'Organisation unit',
        onDataSort: vi.fn(),
    }

    it('shows ascending sort icon when sortDirection is ASC and field matches', () => {
        render(
            <TableWrapper>
                <HeaderCell
                    {...baseProps}
                    isDisconnected={false}
                    sortField="ouname"
                    sortDirection="ASC"
                />
            </TableWrapper>
        )

        const sortButton = screen.getByRole('button', {
            name: /sort by.*organisation unit/i,
        })
        expect(sortButton).toBeInTheDocument()

        // Check for ascending sort SVG class
        expect(sortButton.querySelector('svg.asc')).toBeInTheDocument()
    })

    it('shows descending sort icon when sortDirection is DESC and field matches', () => {
        render(
            <TableWrapper>
                <HeaderCell
                    {...baseProps}
                    isDisconnected={false}
                    sortField="ouname"
                    sortDirection="DESC"
                />
            </TableWrapper>
        )

        const sortButton = screen.getByRole('button', {
            name: /sort by.*organisation unit/i,
        })
        expect(sortButton).toBeInTheDocument()

        // Check for descending sort SVG class
        expect(sortButton.querySelector('svg.desc')).toBeInTheDocument()
    })

    it('shows default sort icon when sortDirection is undefined', () => {
        render(
            <TableWrapper>
                <HeaderCell
                    {...baseProps}
                    isDisconnected={false}
                    sortField="ouname"
                    sortDirection={undefined}
                />
            </TableWrapper>
        )

        const sortButton = screen.getByRole('button', {
            name: /sort by.*organisation unit/i,
        })
        expect(sortButton).toBeInTheDocument()

        // Check for default sort SVG class
        expect(sortButton.querySelector('svg.default')).toBeInTheDocument()
    })

    it('shows default sort icon when sortField does not match name', () => {
        render(
            <TableWrapper>
                <HeaderCell
                    {...baseProps}
                    isDisconnected={false}
                    sortField="different_field"
                    sortDirection="ASC"
                />
            </TableWrapper>
        )

        const sortButton = screen.getByRole('button', {
            name: /sort by.*organisation unit/i,
        })
        expect(sortButton).toBeInTheDocument()

        // Should show default sort icon since sortField doesn't match this column's name
        expect(sortButton.querySelector('svg.default')).toBeInTheDocument()
    })

    it('hides sort icon when isDisconnected is true', () => {
        render(
            <TableWrapper>
                <HeaderCell
                    {...baseProps}
                    isDisconnected={true}
                    sortField="ouname"
                    sortDirection="ASC"
                />
            </TableWrapper>
        )

        // Sort button should not be rendered when disconnected
        const sortButton = screen.queryByRole('button', {
            name: /sort by.*organisation unit/i,
        })
        expect(sortButton).not.toBeInTheDocument()

        // Column header text should still be present
        expect(screen.getByText('Organisation unit')).toBeInTheDocument()
    })

    describe('Sort direction sequence behavior', () => {
        it('cycles from DESC to no sort (undefined) when clicked', async () => {
            const user = userEvent.setup()
            const onDataSort = vi.fn()

            render(
                <TableWrapper>
                    <HeaderCell
                        {...baseProps}
                        onDataSort={onDataSort}
                        isDisconnected={false}
                        sortField="ouname"
                        sortDirection="DESC"
                    />
                </TableWrapper>
            )

            const sortButton = screen.getByRole('button', {
                name: /sort by.*organisation unit/i,
            })

            await user.click(sortButton)

            expect(onDataSort).toHaveBeenCalledWith({
                dimension: 'ouname',
                direction: undefined, // DESC -> undefined (no sort)
            })
        })

        it('cycles from ASC to DESC when clicked', async () => {
            const user = userEvent.setup()
            const onDataSort = vi.fn()

            render(
                <TableWrapper>
                    <HeaderCell
                        {...baseProps}
                        onDataSort={onDataSort}
                        isDisconnected={false}
                        sortField="ouname"
                        sortDirection="ASC"
                    />
                </TableWrapper>
            )

            const sortButton = screen.getByRole('button', {
                name: /sort by.*organisation unit/i,
            })

            await user.click(sortButton)

            expect(onDataSort).toHaveBeenCalledWith({
                dimension: 'ouname',
                direction: 'DESC', // ASC -> DESC
            })
        })

        it('cycles from no sort (default) to ASC when clicked', async () => {
            const user = userEvent.setup()
            const onDataSort = vi.fn()

            render(
                <TableWrapper>
                    <HeaderCell
                        {...baseProps}
                        onDataSort={onDataSort}
                        isDisconnected={false}
                        sortField="ouname"
                        sortDirection={undefined}
                    />
                </TableWrapper>
            )

            const sortButton = screen.getByRole('button', {
                name: /sort by.*organisation unit/i,
            })

            await user.click(sortButton)

            expect(onDataSort).toHaveBeenCalledWith({
                dimension: 'ouname',
                direction: 'ASC', // undefined -> ASC
            })
        })
    })

    it('calls onColumnHeaderClick when header text is clicked', async () => {
        const user = userEvent.setup()
        const onColumnHeaderClick = vi.fn()

        render(
            <TableWrapper>
                <HeaderCell
                    {...baseProps}
                    onColumnHeaderClick={onColumnHeaderClick}
                    isDisconnected={false}
                    sortField="ouname"
                    sortDirection="ASC"
                />
            </TableWrapper>
        )

        const headerText = screen.getByText('Organisation unit')
        await user.click(headerText)

        expect(onColumnHeaderClick).toHaveBeenCalledWith('ou')
    })

    it('does not call onColumnHeaderClick when callback is not provided', async () => {
        render(
            <TableWrapper>
                <HeaderCell
                    {...baseProps}
                    onColumnHeaderClick={undefined}
                    isDisconnected={false}
                    sortField="ouname"
                    sortDirection="ASC"
                />
            </TableWrapper>
        )

        const headerText = screen.getByText('Organisation unit')

        // Should not throw an error when clicked without callback
        expect(() => headerText.click()).not.toThrow()
    })
})
