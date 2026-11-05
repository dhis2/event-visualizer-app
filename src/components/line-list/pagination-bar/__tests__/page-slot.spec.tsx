import { PageSlot } from '@components/line-list/pagination-bar/page-slot'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const renderPageSlot = (props: { page: number; pageCount?: number }) => {
    const onCommit = vi.fn()
    render(<PageSlot disabled={false} onCommit={onCommit} {...props} />)
    return { onCommit, input: screen.getByLabelText('Page number') }
}

describe('PageSlot', () => {
    describe('with totals', () => {
        it('shows the page count in a box as wide as the page input', () => {
            const { input } = renderPageSlot({ page: 7, pageCount: 70 })

            expect(screen.getByText('/')).toBeInTheDocument()
            const pageCount = screen.getByText('70')
            expect(input).toHaveAttribute(
                'style',
                expect.stringContaining('inline-size: 2ch')
            )
            expect(pageCount).toHaveAttribute(
                'style',
                expect.stringContaining('inline-size: 2ch')
            )
        })

        it('goes to the last page when the typed page is past it', async () => {
            const { input, onCommit } = renderPageSlot({
                page: 7,
                pageCount: 70,
            })

            await userEvent.type(input, '75{Enter}')

            expect(onCommit).toHaveBeenCalledWith(70)
        })

        it('goes to the first page when the typed page is 0', async () => {
            const { input, onCommit } = renderPageSlot({
                page: 7,
                pageCount: 70,
            })

            await userEvent.type(input, '0')
            await userEvent.tab()

            expect(onCommit).toHaveBeenCalledWith(1)
        })
    })

    describe('without totals', () => {
        it('holds three digits', () => {
            const { input } = renderPageSlot({ page: 9 })

            expect(input).toHaveAttribute(
                'style',
                expect.stringContaining('inline-size: 3ch')
            )
            expect(screen.queryByText('/')).not.toBeInTheDocument()
        })

        it('grows past page 999', () => {
            const { input } = renderPageSlot({ page: 1000 })

            expect(input).toHaveAttribute(
                'style',
                expect.stringContaining('inline-size: 4ch')
            )
        })

        it('commits any typed page', async () => {
            const { input, onCommit } = renderPageSlot({ page: 7 })

            await userEvent.type(input, '100{Enter}')

            expect(onCommit).toHaveBeenCalledWith(100)
        })
    })

    it('selects the page on focus, so typing replaces it', async () => {
        const { input, onCommit } = renderPageSlot({ page: 7 })

        await userEvent.type(input, '12{Enter}')

        expect(onCommit).toHaveBeenCalledWith(12)
    })

    it('does not commit the current page', async () => {
        const { input, onCommit } = renderPageSlot({ page: 7 })

        await userEvent.type(input, '7{Enter}')

        expect(onCommit).not.toHaveBeenCalled()
    })

    it('does not commit an empty field and shows the page again', async () => {
        const { input, onCommit } = renderPageSlot({ page: 7 })

        await userEvent.clear(input)
        await userEvent.tab()

        expect(onCommit).not.toHaveBeenCalled()
        expect(input).toHaveValue('7')
    })

    it('restores the page on Escape', async () => {
        const { input, onCommit } = renderPageSlot({ page: 7 })

        await userEvent.type(input, '12{Escape}')

        expect(onCommit).not.toHaveBeenCalled()
        expect(input).toHaveValue('7')
    })

    it('strips anything that is not a digit', async () => {
        const { input, onCommit } = renderPageSlot({ page: 7 })

        await userEvent.type(input, '1a2{Enter}')

        expect(onCommit).toHaveBeenCalledWith(12)
    })

    it('is disabled when disabled', () => {
        render(<PageSlot page={1} disabled onCommit={vi.fn()} />)

        expect(screen.getByLabelText('Page number')).toBeDisabled()
    })
})
