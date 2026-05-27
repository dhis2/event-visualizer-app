import {
    visUiConfigSlice,
    initialState as visUiConfigInitialState,
    getVisUiConfigCustomValue,
    getVisUiConfigLastActiveButton,
} from '@store/vis-ui-config-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RootState } from '@types'
import deepmerge from 'deepmerge'
import { describe, it, expect, vi } from 'vitest'
import { CustomValueModal } from '../custom-value-modal'

const ANALYTICS_RESOURCE = 'analytics/enrollments/aggregate/dimensions'

const metadata = {
    p1: {
        id: 'p1',
        name: 'Program 1',
        programType: 'WITH_REGISTRATION',
    },
    s1: {
        id: 's1',
        name: 'Stage 1',
        repeatable: false,
        hideDueDate: false,
        program: { id: 'p1' },
    },
    s2: {
        id: 's2',
        name: 'Stage 2',
        repeatable: false,
        hideDueDate: false,
        program: { id: 'p1' },
    },
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

const initialPreloadedState: Partial<RootState> = {
    visUiConfig: visUiConfigInitialState,
}

const buildMockOptions = (
    layoutColumns: string[],
    queryDataOverride: MockOptions['queryData'] = {
        [ANALYTICS_RESOURCE]: dimensionsResponse,
    },
    customValue?: { id: string; aggregationType: 'SUM' | 'AVERAGE' }
) => ({
    metadata,
    queryData: queryDataOverride,
    partialStore: {
        reducer: { visUiConfig: visUiConfigSlice.reducer },
        preloadedState: deepmerge(initialPreloadedState, {
            visUiConfig: {
                layout: {
                    ...visUiConfigInitialState.layout,
                    columns: layoutColumns,
                },
                customValue,
            },
        }) as Partial<RootState>,
    },
})

describe('CustomValueModal', () => {
    it('shows the loading indicator before data elements load', async () => {
        await renderWithAppWrapper(
            <CustomValueModal onClose={() => {}} />,
            buildMockOptions(['s1.de1'])
        )

        expect(screen.getByText('Loading data')).toBeInTheDocument()
    })

    it('renders the data elements after the query resolves', async () => {
        await renderWithAppWrapper(
            <CustomValueModal onClose={() => {}} />,
            buildMockOptions(['s1.de1'])
        )

        await waitFor(() => {
            expect(screen.getByText('Weight in kg')).toBeInTheDocument()
            expect(screen.getByText('Height in cm')).toBeInTheDocument()
        })
    })

    it('shows the stage-filter notice when the layout has a program stage', async () => {
        await renderWithAppWrapper(
            <CustomValueModal onClose={() => {}} />,
            buildMockOptions(['s1.de1'])
        )

        await waitFor(() => {
            expect(
                screen.getByText(
                    'Showing data elements from stage "Stage 1" which is used in the layout'
                )
            ).toBeInTheDocument()
        })
    })

    it('shows the warning notice when the current custom value is from a different stage', async () => {
        await renderWithAppWrapper(
            <CustomValueModal onClose={() => {}} />,
            buildMockOptions(['s1.de1'], undefined, {
                id: 's2.someDe',
                aggregationType: 'SUM',
            })
        )

        await waitFor(() => {
            expect(
                screen.getByText(
                    /Some DE.*different stage than the dimensions in the layout.*Stage 1/
                )
            ).toBeInTheDocument()
        })
        expect(
            screen.queryByText(/which is used in the layout$/)
        ).not.toBeInTheDocument()
    })

    it('omits the stage-filter notice when the layout has no program stage', async () => {
        await renderWithAppWrapper(
            <CustomValueModal onClose={() => {}} />,
            buildMockOptions(['p1.enrollmentDate'])
        )

        await waitFor(() => {
            expect(screen.getByText('Weight in kg')).toBeInTheDocument()
        })
        expect(
            screen.queryByText(/Showing data elements from stage/)
        ).not.toBeInTheDocument()
    })

    it('renders the empty-state notice when no data elements are returned', async () => {
        await renderWithAppWrapper(
            <CustomValueModal onClose={() => {}} />,
            buildMockOptions(['s1.de1'], {
                [ANALYTICS_RESOURCE]: { dimensions: [] },
            })
        )

        await waitFor(() => {
            expect(
                screen.getByText('No numeric data items in this program')
            ).toBeInTheDocument()
        })
    })

    it('keeps the Update button disabled until a data element is picked, then dispatches and closes on click', async () => {
        const onClose = vi.fn()
        const user = userEvent.setup()
        const { store } = await renderWithAppWrapper(
            <CustomValueModal onClose={onClose} />,
            buildMockOptions(['s1.de1'])
        )

        await waitFor(() => {
            expect(screen.getByText('Weight in kg')).toBeInTheDocument()
        })

        const updateButton = screen.getByRole('button', { name: 'Update' })
        expect(updateButton).toBeDisabled()

        await user.click(screen.getByText('Weight in kg'))
        expect(updateButton).toBeEnabled()

        await user.click(updateButton)

        expect(onClose).toHaveBeenCalledOnce()
        expect(
            getVisUiConfigCustomValue(store.getState() as RootState)
        ).toEqual({
            aggregationType: 'SUM',
            id: 's1.de1',
        })
        expect(
            getVisUiConfigLastActiveButton(store.getState() as RootState)
        ).toBe('CUSTOM_VALUE')
    })
})
