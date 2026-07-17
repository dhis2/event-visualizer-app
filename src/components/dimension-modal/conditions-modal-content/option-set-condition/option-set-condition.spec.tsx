import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { OptionSetCondition } from './option-set-condition'

beforeAll(() => {
    // @ts-expect-error jsdom lacks IntersectionObserver, which the Transfer uses
    global.IntersectionObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
})

const OPTION_SET_ID = 'os1'
const OPTION_SET = { id: OPTION_SET_ID, name: 'Mode of discharge' }
const ALL_OPTIONS = [
    { code: 'ABS', id: 'a1', name: 'Absconded', optionSet: OPTION_SET },
    { code: 'DIE', id: 'a2', name: 'Died', optionSet: OPTION_SET },
    { code: 'DIS', id: 'a3', name: 'Discharged', optionSet: OPTION_SET },
    { code: 'REC', id: 'a4', name: 'Recovered', optionSet: OPTION_SET },
]

const createOptionsResolver = () =>
    vi.fn(async (_type: string, query: { params?: unknown }) => {
        const params = query.params as { filter?: string[] } | undefined
        const filters = params?.filter ?? []
        const searchFilter = filters.find((f) => f.includes(':ilike:'))
        const term = searchFilter?.split(':').pop()?.toLowerCase()
        const items = term
            ? ALL_OPTIONS.filter((o) => o.name.toLowerCase().includes(term))
            : ALL_OPTIONS
        return {
            options: items,
            pager: { page: 1, pageCount: 1, pageSize: 50, total: items.length },
        }
    })

const optionNamesIn = (containerDataTest: string) => {
    const container = document.querySelector(
        `[data-test="${containerDataTest}"]`
    )
    if (!container) {
        return []
    }
    return Array.from(
        container.querySelectorAll('[data-test="option-set-transfer-option"]')
    ).map((el) => el.textContent)
}

const leftOptionNames = () => optionNamesIn('option-set-transfer-sourceoptions')
const rightOptionNames = () =>
    optionNamesIn('option-set-transfer-pickedoptions')

const renderCondition = async (
    resolver: ReturnType<typeof createOptionsResolver>
) => {
    let condition = 'IN:'
    const onChange = vi.fn((value: string) => {
        condition = value
    })
    const view = await renderWithAppWrapper(
        <OptionSetCondition
            condition={condition}
            optionSetId={OPTION_SET_ID}
            onChange={onChange}
        />,
        { queryData: { options: resolver } }
    )
    const rerenderWithLatestCondition = () =>
        view.rerender(
            <OptionSetCondition
                condition={condition}
                optionSetId={OPTION_SET_ID}
                onChange={onChange}
            />
        )
    return { ...view, onChange, rerenderWithLatestCondition }
}

const selectOption = (name: string) => {
    // the Transfer emulates a double-click via two rapid single clicks
    const option = screen.getByText(name)
    fireEvent.click(option)
    fireEvent.click(option)
}

const search = (term: string) => {
    const input = document.querySelector(
        '[data-test="option-set-left-header-filter-input-field"] input'
    ) as HTMLInputElement
    fireEvent.change(input, { target: { value: term } })
}

describe('OptionSetCondition', () => {
    it('narrows only the left (source) list when searching', async () => {
        const { rerenderWithLatestCondition, onChange } = await renderCondition(
            createOptionsResolver()
        )

        await waitFor(() => expect(leftOptionNames()).toHaveLength(4))

        selectOption('Absconded')
        await waitFor(() => expect(onChange).toHaveBeenCalled())
        rerenderWithLatestCondition()

        search('ch')
        await new Promise((resolve) => setTimeout(resolve, 700))

        await waitFor(() => expect(leftOptionNames()).toEqual(['Discharged']))
    })

    it('keeps a selected option on the right even when the search excludes it', async () => {
        const { rerenderWithLatestCondition, onChange } = await renderCondition(
            createOptionsResolver()
        )

        await waitFor(() => expect(leftOptionNames()).toHaveLength(4))

        selectOption('Absconded')
        await waitFor(() => expect(onChange).toHaveBeenCalled())
        rerenderWithLatestCondition()

        await waitFor(() => expect(rightOptionNames()).toEqual(['Absconded']))

        // "Absconded" does not match "ch" — it must stay on the right regardless
        search('ch')
        await new Promise((resolve) => setTimeout(resolve, 700))

        await waitFor(() => expect(leftOptionNames()).toEqual(['Discharged']))
        expect(rightOptionNames()).toEqual(['Absconded'])
    })
})
