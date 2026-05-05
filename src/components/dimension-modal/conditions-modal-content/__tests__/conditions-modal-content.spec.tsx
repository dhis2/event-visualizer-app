import { OPERATOR_IN } from '@modules/conditions'
import { initialState as initialVisUiConfigState } from '@store/vis-ui-config-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DimensionMetadataItem, ProgramStage } from '@types'
import { describe, expect, it } from 'vitest'
import { ConditionsModalContent } from '../conditions-modal-content'

const repeatableStage: ProgramStage = {
    id: 'stage123',
    name: 'Repeatable stage',
    repeatable: true,
    hideDueDate: false,
    program: {
        id: 'program123',
    },
}

const textDimension: DimensionMetadataItem = {
    id: 'stage123.textDimension',
    dimensionId: 'textDimension',
    name: 'Text dimension',
    dimensionType: 'DATA_ELEMENT',
    valueType: 'TEXT',
    programStageId: 'stage123',
}

const numericDimension: DimensionMetadataItem = {
    id: 'stage123.numericDimension',
    dimensionId: 'numericDimension',
    name: 'Numeric dimension',
    dimensionType: 'DATA_ELEMENT',
    valueType: 'NUMBER',
    programStageId: 'stage123',
}

const legendSetMetadata = {
    id: 'legend10y',
    name: 'Age 10y intervals',
    legends: [
        {
            id: 'legendBucket',
            name: '0 - 10',
            startValue: 0,
            endValue: 10,
        },
    ],
}

const renderConditionsModalContent = async (
    dimension: DimensionMetadataItem,
    mockOptions: MockOptions = {}
) => {
    const { metadata, ...restMockOptions } = mockOptions

    return renderWithAppWrapper(
        <ConditionsModalContent dimension={dimension} />,
        {
            ...restMockOptions,
            metadata: {
                stage123: repeatableStage,
                ...metadata,
            },
        }
    )
}

describe('<ConditionsModalContent />', () => {
    it('shows filters and keeps repeated events collapsed by default', async () => {
        const user = userEvent.setup()
        const { store } = await renderConditionsModalContent(textDimension)

        expect(screen.getByText('Filters')).toBeVisible()
        expect(
            screen.getByText('Add a filter to only include some values.')
        ).toBeVisible()

        await user.click(screen.getByRole('button', { name: 'Filters' }))

        expect(
            screen.queryByText('Add a filter to only include some values.')
        ).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Filters' }))

        expect(
            screen.getByText('Add a filter to only include some values.')
        ).toBeVisible()
        expect(screen.getByText('Repeated events')).toBeVisible()
        expect(
            screen.queryByLabelText('Most recent events')
        ).not.toBeInTheDocument()

        await user.click(
            screen.getByRole('button', { name: 'Repeated events' })
        )

        const mostRecentInput = screen.getByLabelText('Most recent events')
        const oldestInput = screen.getByLabelText('Oldest events')

        expect(mostRecentInput).toBeVisible()
        expect(oldestInput).toBeVisible()

        await user.clear(mostRecentInput)
        await user.type(mostRecentInput, '4')

        expect(
            store.getState().visUiConfig.repetitionsByDimension[
                textDimension.id
            ]
        ).toEqual({
            mostRecent: 4,
            oldest: 0,
        })
    })

    it('renders legend set radio options and stores legend choices', async () => {
        const user = userEvent.setup()
        const { container, store } = await renderConditionsModalContent(
            numericDimension,
            {
                queryData: {
                    dataElements: {
                        legendSets: [
                            { id: 'legend10y', name: 'Age 10y intervals' },
                            { id: 'legend15y', name: 'Age 15y intervals' },
                        ],
                    },
                },
            }
        )

        await waitFor(() => {
            expect(screen.getByText('Legend')).toBeVisible()
            expect(screen.getByText('Age 10y intervals')).toBeVisible()
        })

        await waitFor(() => {
            expect(
                store.getState().visUiConfig.conditionsByDimension[
                    numericDimension.id
                ]?.legendSet
            ).toBe('legend10y')
        })

        await user.click(screen.getByRole('button', { name: 'Add a filter' }))

        expect(
            container.querySelector('[data-test="add-condition-menu"]')
        ).not.toBeInTheDocument()
        expect(screen.getByText('Choose legends')).toBeVisible()

        await user.click(screen.getByText('None'))

        expect(
            store.getState().visUiConfig.conditionsByDimension[
                numericDimension.id
            ]
        ).toBeUndefined()
    })

    it('opens repeated events by default when repetitions are configured', async () => {
        await renderConditionsModalContent(textDimension, {
            partialStore: {
                preloadedState: {
                    visUiConfig: {
                        ...initialVisUiConfigState,
                        repetitionsByDimension: {
                            [textDimension.id]: {
                                mostRecent: 4,
                                oldest: 0,
                            },
                        },
                    },
                },
            },
        })

        expect(screen.getByLabelText('Most recent events')).toBeVisible()
        expect(screen.getByLabelText('Oldest events')).toBeVisible()
    })

    it('removes legend-backed filter rows when selecting no legend', async () => {
        const user = userEvent.setup()
        const { store } = await renderConditionsModalContent(numericDimension, {
            metadata: {
                legend10y: legendSetMetadata,
            },
            partialStore: {
                preloadedState: {
                    visUiConfig: {
                        ...initialVisUiConfigState,
                        conditionsByDimension: {
                            [numericDimension.id]: {
                                condition: `${OPERATOR_IN}:legendBucket`,
                                legendSet: 'legend10y',
                            },
                        },
                    },
                },
            },
            queryData: {
                dataElements: {
                    legendSets: [
                        { id: 'legend10y', name: 'Age 10y intervals' },
                    ],
                },
            },
        })

        await waitFor(() => {
            expect(screen.getByText('Age 10y intervals')).toBeVisible()
            expect(screen.getByText('0 - 10')).toBeVisible()
        })

        await user.click(screen.getByText('None'))

        expect(
            store.getState().visUiConfig.conditionsByDimension[
                numericDimension.id
            ]
        ).toBeUndefined()
        expect(screen.queryByText('0 - 10')).not.toBeInTheDocument()
        expect(
            screen.getByText('Add a filter to only include some values.')
        ).toBeVisible()
    })
})
