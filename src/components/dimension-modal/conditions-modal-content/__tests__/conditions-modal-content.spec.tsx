import { OPERATOR_IN } from '@modules/conditions'
import { initialState as initialVisUiConfigState } from '@store/vis-ui-config-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { screen, waitFor, within } from '@testing-library/react'
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
    it('renders the filters section header and collapse control even when no repeated events or range grouping', async () => {
        await renderConditionsModalContent(textDimension, {
            metadata: {
                stage123: {
                    ...repeatableStage,
                    repeatable: false,
                },
            },
        })

        const filtersToggle = screen.getByRole('button', { name: 'Filters' })
        expect(filtersToggle).toBeVisible()
        expect(filtersToggle).toHaveAttribute('aria-expanded', 'false')
    })

    it('shows filters and keeps repeated events collapsed by default', async () => {
        const user = userEvent.setup()
        const { store } = await renderConditionsModalContent(textDimension)

        expect(screen.getByText('Filters')).toBeVisible()

        await user.click(screen.getByRole('button', { name: 'Filters' }))

        expect(
            screen.queryByRole('button', { name: 'Add a filter' })
        ).toBeNull()
        expect(screen.getByText('Choose an operator')).toBeVisible()
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

    it('shows an enabled placeholder filter row when no filters are configured', async () => {
        const user = userEvent.setup()
        const { container, store } =
            await renderConditionsModalContent(numericDimension)

        await user.click(screen.getByRole('button', { name: 'Filters' }))

        const placeholder = container.querySelector(
            '[data-test="condition-placeholder"]'
        ) as HTMLElement
        expect(placeholder).toBeVisible()
        expect(
            within(placeholder).getByText('Choose an operator')
        ).toBeVisible()
        expect(
            screen.queryByRole('button', { name: 'Add a filter' })
        ).toBeNull()
        expect(placeholder.querySelector('input[type="number"]')).toBeDisabled()
        expect(
            within(placeholder).getByRole('button', { name: 'Remove' })
        ).toBeDisabled()
        expect(
            store.getState().visUiConfig.conditionsByDimension[
                numericDimension.id
            ]
        ).toBeUndefined()

        await user.click(within(placeholder).getByText('Choose an operator'))
        await user.click(screen.getByText('equal to (=)'))

        expect(
            screen.getByRole('button', { name: 'Add another filter' })
        ).toBeVisible()
        expect(
            container.querySelector('[data-test="condition-placeholder"]')
        ).not.toBeInTheDocument()
    })

    it('shows the placeholder after removing the last numeric filter', async () => {
        const user = userEvent.setup()
        const { container, store } = await renderConditionsModalContent(
            numericDimension,
            {
                partialStore: {
                    preloadedState: {
                        visUiConfig: {
                            ...initialVisUiConfigState,
                            conditionsByDimension: {
                                [numericDimension.id]: {
                                    condition: 'EQ:5',
                                },
                            },
                        },
                    },
                },
            }
        )

        const removeButton = screen.getByRole('button', { name: 'Remove' })
        expect(removeButton).toBeEnabled()

        await user.click(removeButton)

        expect(
            store.getState().visUiConfig.conditionsByDimension[
                numericDimension.id
            ]
        ).toBeUndefined()
        expect(
            container.querySelectorAll('[data-test="condition-placeholder"]')
        ).toHaveLength(1)
        expect(screen.getByText('Choose an operator')).toBeVisible()
        expect(
            screen.queryByRole('button', { name: 'Add another filter' })
        ).toBeNull()
        expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled()
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
            expect(screen.getByText('Range grouping')).toBeVisible()
            expect(screen.getByText('Age 10y intervals')).toBeVisible()
        })

        await user.click(screen.getByRole('button', { name: 'Range grouping' }))

        expect(screen.queryByText('Age 10y intervals')).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Range grouping' }))

        expect(screen.getByText('Age 10y intervals')).toBeVisible()

        await waitFor(() => {
            expect(
                store.getState().visUiConfig.conditionsByDimension[
                    numericDimension.id
                ]?.legendSet
            ).toBe('legend10y')
        })

        await user.click(screen.getByRole('button', { name: 'Filters' }))

        await user.click(screen.getByText('Choose an operator'))
        await user.click(screen.getByText('is one of preset options'))

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
            expect(screen.getAllByText('Age 10y intervals')).not.toHaveLength(0)
            expect(screen.getByText('0 - 10')).toBeVisible()
        })

        await user.click(screen.getByText('None'))

        expect(
            store.getState().visUiConfig.conditionsByDimension[
                numericDimension.id
            ]
        ).toBeUndefined()
        expect(screen.queryByText('0 - 10')).not.toBeInTheDocument()
        expect(screen.getByText('Choose an operator')).toBeVisible()
    })

    it('shows range grouping and filters sections when legend sets are available', async () => {
        await renderConditionsModalContent(numericDimension, {
            metadata: {
                stage123: {
                    ...repeatableStage,
                    repeatable: false,
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
            expect(screen.getByText('Range grouping')).toBeVisible()
            expect(screen.getByText('Age 10y intervals')).toBeVisible()
        })

        expect(screen.getByRole('button', { name: 'Filters' })).toBeVisible()
    })
})
