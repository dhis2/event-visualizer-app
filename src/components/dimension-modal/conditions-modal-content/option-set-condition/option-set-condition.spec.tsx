import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import type { InitialMetadataItems } from '@types'
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
    resolver: ReturnType<typeof createOptionsResolver>,
    {
        initialCondition = 'IN:',
        metadata,
    }: { initialCondition?: string; metadata?: InitialMetadataItems } = {}
) => {
    let condition = initialCondition
    const onChange = vi.fn((value: string) => {
        condition = value
    })
    const view = await renderWithAppWrapper(
        <OptionSetCondition
            condition={condition}
            optionSetId={OPTION_SET_ID}
            onChange={onChange}
        />,
        { queryData: { options: resolver }, metadata }
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

    it('keeps a previously-selected option when adding another from a filtered list', async () => {
        /* Reopening a saved condition: the earlier selection ("Absconded") is
         * already in the store and in the condition, but not in the list once
         * it is filtered out. Adding a second option must not drop the first. */
        const { rerenderWithLatestCondition, onChange } = await renderCondition(
            createOptionsResolver(),
            {
                initialCondition: 'IN:ABS',
                metadata: {
                    [OPTION_SET_ID]: {
                        id: OPTION_SET_ID,
                        name: 'Mode of discharge',
                        options: [ALL_OPTIONS[0]],
                    },
                },
            }
        )

        await waitFor(() => expect(rightOptionNames()).toEqual(['Absconded']))

        search('disch')
        await new Promise((resolve) => setTimeout(resolve, 700))
        await waitFor(() => expect(leftOptionNames()).toEqual(['Discharged']))

        selectOption('Discharged')
        await waitFor(() => expect(onChange).toHaveBeenCalledWith('IN:ABS;DIS'))
        rerenderWithLatestCondition()

        /* Asserted synchronously: the option is dropped the moment it is added.
         * A `waitFor` would mask the bug — a late unfiltered re-fetch repopulates
         * the source list and the Transfer would re-derive the missing label. */
        expect(rightOptionNames()).toEqual(['Absconded', 'Discharged'])
    })
})
