import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import type { CurrentVisualization, Layout, RootState } from '@types'
import { describe, it, expect } from 'vitest'
import { UnappliedChangesNotice } from '../unapplied-changes-notice'

const STAGE_ID = 'stage1'
const DIMENSION_ID = `${STAGE_ID}.de1`

const metadata = {
    [STAGE_ID]: { id: STAGE_ID, name: 'Stage 1' },
    [DIMENSION_ID]: {
        id: DIMENSION_ID,
        name: 'Data element 1',
        dimensionId: 'de1',
        programStageId: STAGE_ID,
        dimensionType: 'DATA_ELEMENT',
        valueType: 'TEXT',
    },
}

/* digitGroupSeparator is seeded onto the default store's visUiConfig from the
 * mocked system settings (src/test-utils/__fixtures__/system-settings.json),
 * so a currentVis that matches the default ui config must carry the same
 * value. */
const populatedVis = {
    type: 'LINE_LIST',
    outputType: 'EVENT',
    digitGroupSeparator: 'SPACE',
    columns: [],
    rows: [],
    filters: [],
} as unknown as CurrentVisualization

const layoutWithDimension = {
    columns: [DIMENSION_ID],
    rows: [],
    filters: [],
} as unknown as Layout

const renderNotice = (preloadedState: Partial<RootState>) =>
    renderWithAppWrapper(<UnappliedChangesNotice />, {
        metadata,
        partialStore: { preloadedState },
    })

describe('UnappliedChangesNotice', () => {
    it('renders nothing when the visualization matches the ui config', async () => {
        await renderNotice({ currentVis: populatedVis })

        expect(
            screen.queryByTestId('unapplied-changes-notice')
        ).not.toBeInTheDocument()
    })

    it('renders the notice when there are unapplied changes', async () => {
        await renderNotice({
            currentVis: populatedVis,
            visUiConfig: { layout: layoutWithDimension },
        } as Partial<RootState>)

        expect(await screen.findByText('Unapplied changes')).toBeVisible()
    })

    it('renders nothing while the visualization is loading', async () => {
        await renderNotice({
            currentVis: populatedVis,
            visUiConfig: { layout: layoutWithDimension },
            loader: { isVisualizationLoading: true },
        } as Partial<RootState>)

        expect(
            screen.queryByTestId('unapplied-changes-notice')
        ).not.toBeInTheDocument()
    })
})
