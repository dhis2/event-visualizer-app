import { visUiConfigSlice, initialState } from '@store/vis-ui-config-slice'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {
    DimensionMetadataItem,
    InitialMetadataItems,
    VisualizationType,
} from '@types'
import { describe, it, expect } from 'vitest'
import { ConditionsModalContent } from '../conditions-modal-content'

const STAGE_ID = 'stage1'

const stageMetadata = (repeatable: boolean): InitialMetadataItems => ({
    [STAGE_ID]: {
        id: STAGE_ID,
        name: 'Stage 1',
        hideDueDate: false,
        repeatable,
        program: { id: 'prog1' },
    },
})

const textDimension: DimensionMetadataItem = {
    id: `${STAGE_ID}.de1`,
    dimensionId: 'de1',
    dimensionType: 'DATA_ELEMENT',
    programStageId: STAGE_ID,
    name: 'My text element',
    valueType: 'TEXT',
}

const programIndicatorDimension: DimensionMetadataItem = {
    id: 'pi1',
    dimensionId: 'pi1',
    dimensionType: 'PROGRAM_INDICATOR',
    programStageId: STAGE_ID,
    name: 'My program indicator',
    valueType: 'NUMBER',
}

const renderModalContent = async ({
    dimension = textDimension,
    metadata = stageMetadata(true),
    visualizationType = 'LINE_LIST',
}: {
    dimension?: DimensionMetadataItem
    metadata?: InitialMetadataItems
    visualizationType?: VisualizationType
} = {}) =>
    await renderWithAppWrapper(
        <ConditionsModalContent dimension={dimension} />,
        {
            metadata,
            partialStore: {
                reducer: { visUiConfig: visUiConfigSlice.reducer },
                preloadedState: {
                    visUiConfig: { ...initialState, visualizationType },
                },
            },
        }
    )

const queryTab = (name: string) => screen.queryByText(name)

const expectNoTabBar = () => {
    expect(queryTab('Data')).not.toBeInTheDocument()
    expect(queryTab('Repeated events')).not.toBeInTheDocument()
    expect(
        screen.getByRole('radio', { name: 'Show all values' })
    ).toBeInTheDocument()
}

describe('ConditionsModalContent — tab bar visibility', () => {
    it('shows both tabs for a data element on a repeatable stage in a line list', async () => {
        await renderModalContent()

        expect(queryTab('Data')).toBeInTheDocument()
        expect(queryTab('Repeated events')).toBeInTheDocument()
    })

    it('hides the tab bar when the stage is not repeatable', async () => {
        await renderModalContent({ metadata: stageMetadata(false) })

        expectNoTabBar()
    })

    it('hides the tab bar when the stage is not in the metadata store', async () => {
        await renderModalContent({ metadata: {} })

        expectNoTabBar()
    })

    it('hides the tab bar for a pivot table', async () => {
        await renderModalContent({ visualizationType: 'PIVOT_TABLE' })

        expectNoTabBar()
    })

    it('hides the tab bar for a dimension that is not a data element', async () => {
        await renderModalContent({ dimension: programIndicatorDimension })

        expectNoTabBar()
    })
})

describe('ConditionsModalContent — switching tabs', () => {
    it('swaps the panel between the conditions and repeated events content', async () => {
        const user = userEvent.setup()
        await renderModalContent()

        expect(
            screen.getByRole('radio', { name: 'Show all values' })
        ).toBeInTheDocument()

        await user.click(screen.getByText('Repeated events'))

        expect(screen.getByTestId('most-recent-value')).toBeInTheDocument()
        expect(
            screen.queryByRole('radio', { name: 'Show all values' })
        ).not.toBeInTheDocument()

        await user.click(screen.getByText('Data'))

        expect(
            screen.getByRole('radio', { name: 'Show all values' })
        ).toBeInTheDocument()
        expect(
            screen.queryByTestId('most-recent-value')
        ).not.toBeInTheDocument()
    })
})
