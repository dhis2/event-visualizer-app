import { PageSizeMenu } from '@components/line-list/pagination-bar/page-size-menu'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const renderMenu = ({ disabled = false } = {}) => {
    const onChange = vi.fn()
    render(
        <PageSizeMenu pageSize={100} disabled={disabled} onChange={onChange} />
    )
    return { onChange, button: screen.getByTestId('pagination-options') }
}

const choosePageSize = async (size: string) => {
    await userEvent.click(
        within(screen.getByTestId('pagination-page-size-select')).getByTestId(
            'dhis2-uicore-select-input'
        )
    )
    await userEvent.click(
        await screen.findByText(size, {
            selector: '[data-test="dhis2-uicore-singleselectoption"] *',
        })
    )
}

describe('PageSizeMenu', () => {
    it('shows the page size select when opened', async () => {
        const { button } = renderMenu()

        await userEvent.click(button)

        const select = screen.getByTestId('pagination-page-size-select')
        expect(
            within(select).getByText('Rows per page (view only)')
        ).toBeInTheDocument()
        expect(within(select).getByText('100')).toBeInTheDocument()
    })

    it('reports a new page size and closes', async () => {
        const { button, onChange } = renderMenu()
        await userEvent.click(button)

        await choosePageSize('25')

        expect(onChange).toHaveBeenCalledWith(25)
        await waitFor(() =>
            expect(
                screen.queryByTestId('pagination-page-size-select')
            ).not.toBeInTheDocument()
        )
    })

    it('does not report the current page size', async () => {
        const { button, onChange } = renderMenu()
        await userEvent.click(button)

        await choosePageSize('100')

        expect(onChange).not.toHaveBeenCalled()
    })

    it('closes on Escape', async () => {
        const { button } = renderMenu()
        await userEvent.click(button)

        await userEvent.keyboard('{Escape}')

        expect(
            screen.queryByTestId('pagination-page-size-select')
        ).not.toBeInTheDocument()
    })

    it('closes on a click outside', async () => {
        const { button } = renderMenu()
        await userEvent.click(button)

        const backdrop = screen
            .getByTestId('dhis2-uicore-layer')
            .querySelector('.backdrop')
        await userEvent.click(backdrop!)

        expect(
            screen.queryByTestId('pagination-page-size-select')
        ).not.toBeInTheDocument()
    })

    it('is disabled when disabled', () => {
        const { button } = renderMenu({ disabled: true })

        expect(button).toBeDisabled()
    })
})
