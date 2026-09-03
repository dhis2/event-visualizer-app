import { getCurrentVis } from '@store/current-vis-slice'
import {
    initialState as visUiConfigInitialState,
    getVisUiConfigCustomValue,
} from '@store/vis-ui-config-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { createDeferredQuery } from '@test-utils/deferred-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UserEvent } from '@testing-library/user-event'
import type { RootState } from '@types'
import deepmerge from 'deepmerge'
import { describe, it, expect, vi } from 'vitest'
import { CellValueModal } from '../cell-value-modal'

const ANALYTICS_RESOURCE = 'analytics/enrollments/aggregate/dimensions'

const stage1 = {
    id: 's1',
    name: 'Stage 1',
    repeatable: false,
    hideDueDate: false,
    program: { id: 'p1' },
}
const stage2 = {
    id: 's2',
    name: 'Stage 2',
    repeatable: false,
    hideDueDate: false,
    program: { id: 'p1' },
}
const metadata = {
    p1: {
        id: 'p1',
        name: 'Program 1',
        programType: 'WITH_REGISTRATION',
        programStages: [stage1, stage2],
    },
    s1: stage1,
    s2: stage2,
    's1.de1': {
        id: 's1.de1',
        name: 'DE 1',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
    },
    's2.someDe': {
        id: 's2.someDe',
        name: 'Some DE',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
    },
    'p1.enrollmentDate': {
        id: 'p1.enrollmentDate',
        name: 'Enrollment Date',
        dimensionType: 'PERIOD',
        valueType: 'DATE',
    },
}

const dimensionsResponse = {
    dimensions: [
        {
            id: 's1.de1',
            name: 'Weight in kg',
            aggregationType: 'SUM',
            dimensionType: 'DATA_ELEMENT',
        },
        {
            id: 's1.de2',
            name: 'Height in cm',
            aggregationType: 'AVERAGE',
            dimensionType: 'DATA_ELEMENT',
        },
    ],
}

const defaultQueryData: MockOptions['queryData'] = {
    [ANALYTICS_RESOURCE]: dimensionsResponse,
}

const initialPreloadedState: Partial<RootState> = {
    visUiConfig: visUiConfigInitialState,
}

const buildMockOptions = (
    layoutColumns: string[],
    queryDataOverride: MockOptions['queryData'] = defaultQueryData,
    customValue?: { id: string; aggregationType: 'SUM' | 'AVERAGE' }
) => ({
    metadata,
    queryData: queryDataOverride,
    partialStore: {
        preloadedState: deepmerge(initialPreloadedState, {
            visUiConfig: {
                visualizationType: 'PIVOT_TABLE',
                layout: {
                    ...visUiConfigInitialState.layout,
                    columns: layoutColumns,
                },
                customValue,
            },
        }),
    },
})

const selectCustomValueMode = async (user: UserEvent) => {
    await user.click(screen.getByRole('radio', { name: /Custom value/ }))
}

describe('CellValueModal', () => {
    it('starts in Count mode with the item picker hidden, and can be updated straight away', async () => {
        const onClose = vi.fn()
        const user = userEvent.setup()
        const { store } = await renderWithAppWrapper(
            <CellValueModal onClose={onClose} />,
            buildMockOptions(['s1.de1'])
        )

        expect(screen.getByRole('radio', { name: /Count/ })).toBeChecked()
        expect(
            screen.queryByPlaceholderText('Search data items')
        ).not.toBeInTheDocument()

        const updateButton = screen.getByRole('button', { name: 'Update' })
        expect(updateButton).toBeEnabled()

        await user.click(updateButton)

        expect(onClose).toHaveBeenCalledOnce()
        expect(getVisUiConfigCustomValue(store.getState())).toBeUndefined()
    })

    it('starts in Custom value mode with the picker expanded when a custom value is stored', async () => {
        await renderWithAppWrapper(
            <CellValueModal onClose={() => {}} />,
            buildMockOptions(['s1.de1'], undefined, {
                id: 's1.de1',
                aggregationType: 'SUM',
            })
        )

        expect(
            screen.getByRole('radio', { name: /Custom value/ })
        ).toBeChecked()
        await waitFor(() => {
            expect(screen.getByText('Weight in kg')).toBeInTheDocument()
        })
    })

    it('clears the stored custom value when switching back to Count', async () => {
        const user = userEvent.setup()
        const { store } = await renderWithAppWrapper(
            <CellValueModal onClose={() => {}} />,
            buildMockOptions(['s1.de1'], undefined, {
                id: 's1.de1',
                aggregationType: 'SUM',
            })
        )

        await user.click(screen.getByRole('radio', { name: /Count/ }))
        await user.click(screen.getByRole('button', { name: 'Update' }))

        expect(getVisUiConfigCustomValue(store.getState())).toBeUndefined()
        expect(getCurrentVis(store.getState()).value).toBeUndefined()
    })

    it('shows the loading indicator before data items load', async () => {
        const deferred = createDeferredQuery()
        await renderWithAppWrapper(
            <CellValueModal onClose={() => {}} />,
            buildMockOptions(['s1.de1'], {
                [ANALYTICS_RESOURCE]: deferred.defer(() => dimensionsResponse),
            } as unknown as MockOptions['queryData'])
        )

        await selectCustomValueMode(userEvent.setup())

        expect(screen.getByText('Loading data')).toBeInTheDocument()

        await deferred.releaseAll()

        await waitFor(() => {
            expect(screen.queryByText('Loading data')).not.toBeInTheDocument()
        })
    })

    it('renders the data items after the query resolves', async () => {
        await renderWithAppWrapper(
            <CellValueModal onClose={() => {}} />,
            buildMockOptions(['s1.de1'])
        )

        await selectCustomValueMode(userEvent.setup())

        await waitFor(() => {
            expect(screen.getByText('Weight in kg')).toBeInTheDocument()
            expect(screen.getByText('Height in cm')).toBeInTheDocument()
        })
    })

    it('renders the program-scoped empty-state notice when no data items are returned and the layout has no stage', async () => {
        await renderWithAppWrapper(
            <CellValueModal onClose={() => {}} />,
            buildMockOptions(['p1.enrollmentDate'], {
                [ANALYTICS_RESOURCE]: { dimensions: [] },
            })
        )

        await selectCustomValueMode(userEvent.setup())

        await waitFor(() => {
            expect(
                screen.getByText('No numeric data items in this program')
            ).toBeInTheDocument()
        })
    })

    it('keeps the Update button disabled until a data item is picked, then applies and closes on click', async () => {
        const onClose = vi.fn()
        const user = userEvent.setup()
        const { store } = await renderWithAppWrapper(
            <CellValueModal onClose={onClose} />,
            buildMockOptions(['s1.de1'])
        )

        await selectCustomValueMode(user)

        await waitFor(() => {
            expect(screen.getByText('Weight in kg')).toBeInTheDocument()
        })

        expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled()

        await user.click(screen.getByText('Weight in kg'))

        const updateButton = screen.getByRole('button', { name: 'Update' })
        expect(updateButton).toBeEnabled()

        await user.click(updateButton)

        expect(onClose).toHaveBeenCalledOnce()
        expect(getVisUiConfigCustomValue(store.getState())).toEqual({
            aggregationType: 'SUM',
            id: 's1.de1',
        })
        expect(getCurrentVis(store.getState()).value).toEqual({ id: 's1.de1' })
    })

    it('filters the data item list by the search term', async () => {
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <CellValueModal onClose={() => {}} />,
            buildMockOptions(['s1.de1'])
        )

        await selectCustomValueMode(user)

        await waitFor(() => {
            expect(screen.getByText('Weight in kg')).toBeInTheDocument()
            expect(screen.getByText('Height in cm')).toBeInTheDocument()
        })

        await user.type(
            screen.getByPlaceholderText('Search data items'),
            'height'
        )

        expect(screen.queryByText('Weight in kg')).not.toBeInTheDocument()
        expect(screen.getByText('Height in cm')).toBeInTheDocument()

        await user.clear(screen.getByPlaceholderText('Search data items'))
        await user.type(screen.getByPlaceholderText('Search data items'), 'zzz')

        expect(
            screen.getByText('No data items match "zzz"')
        ).toBeInTheDocument()
    })

    it('falls back to AVERAGE when applying an item whose default aggregation type is NONE', async () => {
        const onClose = vi.fn()
        const user = userEvent.setup()
        const { store } = await renderWithAppWrapper(
            <CellValueModal onClose={onClose} />,
            buildMockOptions(['s1.de1'], {
                [ANALYTICS_RESOURCE]: {
                    dimensions: [
                        {
                            id: 'attr1',
                            name: 'Gender score',
                            aggregationType: 'NONE',
                            dimensionType: 'PROGRAM_ATTRIBUTE',
                        },
                    ],
                },
            })
        )

        await selectCustomValueMode(user)

        await waitFor(() => {
            expect(screen.getByText('Gender score')).toBeInTheDocument()
        })

        await user.click(screen.getByText('Gender score'))
        await user.click(screen.getByRole('button', { name: 'Update' }))

        expect(getVisUiConfigCustomValue(store.getState())).toEqual({
            aggregationType: 'AVERAGE',
            id: 'attr1',
        })
    })

    it('disables "Use item default" and selects Average when the item default is NONE', async () => {
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <CellValueModal onClose={() => {}} />,
            buildMockOptions(['s1.de1'], {
                [ANALYTICS_RESOURCE]: {
                    dimensions: [
                        {
                            id: 'attr1',
                            name: 'Gender score',
                            aggregationType: 'NONE',
                            dimensionType: 'PROGRAM_ATTRIBUTE',
                        },
                        {
                            id: 's1.de1',
                            name: 'Weight in kg',
                            aggregationType: 'SUM',
                            dimensionType: 'DATA_ELEMENT',
                        },
                    ],
                },
            })
        )

        await selectCustomValueMode(user)

        await waitFor(() => {
            expect(screen.getByText('Gender score')).toBeInTheDocument()
        })

        // An aggregatable item keeps "Use item default" as the selection
        await user.click(screen.getByText('Weight in kg'))
        expect(screen.getByText('Use item default')).toBeInTheDocument()

        // A NONE item switches the selection to Average instead
        await user.click(screen.getByText('Gender score'))
        expect(screen.getByText('Average')).toBeInTheDocument()

        // ...and "Use item default" is disabled in the dropdown
        await user.click(screen.getByText('Average'))
        expect(
            screen
                .getByText('Use item default')
                .closest('[data-test="dhis2-uicore-singleselectoption"]')
        ).toHaveClass('disabled')
    })

    it('reverts to "Use item default" when switching from a NONE item back to an aggregatable one', async () => {
        const user = userEvent.setup()
        await renderWithAppWrapper(
            <CellValueModal onClose={() => {}} />,
            buildMockOptions(['s1.de1'], {
                [ANALYTICS_RESOURCE]: {
                    dimensions: [
                        {
                            id: 'attr1',
                            name: 'Gender score',
                            aggregationType: 'NONE',
                            dimensionType: 'PROGRAM_ATTRIBUTE',
                        },
                        {
                            id: 's1.de1',
                            name: 'Weight in kg',
                            aggregationType: 'SUM',
                            dimensionType: 'DATA_ELEMENT',
                        },
                    ],
                },
            })
        )

        await selectCustomValueMode(user)

        await waitFor(() => {
            expect(screen.getByText('Gender score')).toBeInTheDocument()
        })

        await user.click(screen.getByText('Gender score'))
        expect(screen.getByText('Average')).toBeInTheDocument()

        await user.click(screen.getByText('Weight in kg'))
        expect(screen.getByText('Use item default')).toBeInTheDocument()
        expect(screen.queryByText('Average')).not.toBeInTheDocument()
    })
})
