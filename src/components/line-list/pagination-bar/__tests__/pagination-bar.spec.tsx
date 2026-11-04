import { PaginationBar } from '@components/line-list/pagination-bar/pagination-bar'
import { ScrollBox } from '@components/line-list/scroll-box'
import type { LineListPager } from '@components/line-list/types'
import i18n from '@dhis2/d2-i18n'
import { createMetadataStoreStub } from '@test-utils/metadata-store-stub'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CurrentVisualization } from '@types'
import type { ComponentProps } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock(
    '@components/app-wrapper/metadata-provider/metadata-provider',
    async (importOriginal) => ({
        ...(await importOriginal<object>()),
        useMetadataStore: () => createMetadataStoreStub(),
    })
)

const visualization = {
    type: 'LINE_LIST',
    outputType: 'EVENT',
    digitGroupSeparator: 'COMMA',
    programDimensions: [],
} as unknown as CurrentVisualization

const PAGE_TWO_OF_MANY: LineListPager = {
    page: 2,
    pageSize: 100,
    isLastPage: false,
}

type BarProps = Partial<ComponentProps<typeof PaginationBar>>

const renderBar = (props: BarProps = {}) => {
    const onPaginate = vi.fn()
    const barProps = {
        colSpan: 3,
        pager: PAGE_TWO_OF_MANY,
        pageLength: 100,
        visualization,
        isFetching: false,
        isDisconnected: false,
        onPaginate,
        ...props,
    }
    const view = render(
        <ScrollBox>
            <table>
                <tfoot>
                    <tr>
                        <PaginationBar {...barProps} />
                    </tr>
                </tfoot>
            </table>
        </ScrollBox>
    )
    const rerender = (newProps: BarProps) =>
        view.rerender(
            <ScrollBox>
                <table>
                    <tfoot>
                        <tr>
                            <PaginationBar {...barProps} {...newProps} />
                        </tr>
                    </tfoot>
                </table>
            </ScrollBox>
        )
    return { onPaginate, rerender }
}

const pageInput = () => screen.getByLabelText('Page number')
const previousButton = () => screen.getByTestId('pagination-previous')
const nextButton = () => screen.getByTestId('pagination-next')

describe('PaginationBar', () => {
    beforeAll(() => {
        i18n.addResourceBundle('en', 'translation', {
            '{{- formattedCount}} event_plural': '{{- formattedCount}} events',
        })
    })

    describe('display', () => {
        it('shows no count without totals on a page of many', () => {
            renderBar()

            expect(previousButton()).toBeEnabled()
            expect(nextButton()).toBeEnabled()
            expect(pageInput()).toHaveValue('2')
            expect(
                screen.queryByTestId('pagination-row-count')
            ).not.toBeInTheDocument()
        })

        it('disables next on the last page without totals', () => {
            renderBar({ pager: { page: 3, pageSize: 100, isLastPage: true } })

            expect(nextButton()).toBeDisabled()
        })

        it('shows the page count and the total with totals', () => {
            renderBar({
                pager: { page: 1, pageSize: 100, total: 1234, pageCount: 13 },
            })

            expect(pageInput()).toHaveValue('1')
            expect(screen.getByText('13')).toBeInTheDocument()
            expect(
                screen.getByTestId('pagination-row-count')
            ).toHaveTextContent('1,234 events')
            expect(previousButton()).toBeDisabled()
            expect(nextButton()).toBeEnabled()
        })

        it('disables next on the last page with totals', () => {
            renderBar({
                pager: { page: 13, pageSize: 100, total: 1234, pageCount: 13 },
            })

            expect(nextButton()).toBeDisabled()
        })

        it('shows only the count on a single page', () => {
            renderBar({
                pager: { page: 1, pageSize: 100, isLastPage: true },
                pageLength: 40,
            })

            expect(
                screen.queryByTestId('pagination-previous')
            ).not.toBeInTheDocument()
            expect(
                screen.queryByTestId('pagination-next')
            ).not.toBeInTheDocument()
            expect(
                screen.queryByLabelText('Page number')
            ).not.toBeInTheDocument()
            expect(
                screen.getByTestId('pagination-row-count')
            ).toHaveTextContent('40 events')
            expect(screen.getByTestId('pagination-options')).toBeInTheDocument()
        })

        it('disables the bar while a page loads', () => {
            renderBar({ isFetching: true })

            expect(previousButton()).toBeDisabled()
            expect(nextButton()).toBeDisabled()
            expect(pageInput()).toBeDisabled()
            expect(screen.getByTestId('pagination-options')).toBeDisabled()
        })

        it('disables the bar when offline', () => {
            renderBar({ isDisconnected: true })

            expect(previousButton()).toBeDisabled()
            expect(nextButton()).toBeDisabled()
            expect(pageInput()).toBeDisabled()
            expect(screen.getByTestId('pagination-options')).toBeDisabled()
        })

        it('explains why the bar is disabled when offline', async () => {
            renderBar({ isDisconnected: true })

            await userEvent.hover(screen.getByTestId('pagination-bar'))

            expect(
                await screen.findByText('Not available offline')
            ).toBeInTheDocument()
        })
    })

    describe('paging', () => {
        const typePage = (page: string) => {
            fireEvent.focus(pageInput())
            fireEvent.change(pageInput(), { target: { value: page } })
            fireEvent.keyDown(pageInput(), { key: 'Enter' })
        }

        const choosePageSize = (size: string) => {
            fireEvent.click(screen.getByTestId('pagination-options'))
            fireEvent.click(screen.getByTestId('dhis2-uicore-select-input'))
            fireEvent.click(
                screen.getByText(size, {
                    selector: '[data-test="dhis2-uicore-singleselectoption"] *',
                })
            )
        }

        it('requests the next page', () => {
            const { onPaginate } = renderBar()

            fireEvent.click(nextButton())

            expect(onPaginate).toHaveBeenCalledWith({ page: 3, pageSize: 100 })
        })

        it('requests the previous page', () => {
            const { onPaginate } = renderBar()

            fireEvent.click(previousButton())

            expect(onPaginate).toHaveBeenCalledWith({ page: 1, pageSize: 100 })
        })

        it('requests a typed page', () => {
            const { onPaginate } = renderBar()

            typePage('7')

            expect(onPaginate).toHaveBeenCalledWith({ page: 7, pageSize: 100 })
        })

        it('does not request the page already shown', () => {
            const { onPaginate } = renderBar()

            typePage('2')

            expect(onPaginate).not.toHaveBeenCalled()
        })

        it('keeps the page size when paging', () => {
            const { onPaginate } = renderBar({
                pager: { page: 1, pageSize: 25, isLastPage: false },
            })

            fireEvent.click(nextButton())

            expect(onPaginate).toHaveBeenCalledWith({ page: 2, pageSize: 25 })
        })

        it('requests the first page with a new page size', () => {
            const { onPaginate } = renderBar()

            choosePageSize('50')

            expect(onPaginate).toHaveBeenCalledWith({ page: 1, pageSize: 50 })
        })

        it('shows the page of a new response', () => {
            const { rerender } = renderBar({
                pager: { page: 5, pageSize: 100, isLastPage: false },
            })

            rerender({ pager: { page: 1, pageSize: 100, isLastPage: false } })

            expect(pageInput()).toHaveValue('1')
        })
    })
})
