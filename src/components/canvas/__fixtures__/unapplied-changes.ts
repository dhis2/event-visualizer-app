import type { CurrentVisualization } from '@types'

export const STAGE_ID = 'stage1'
export const DIMENSION_ID = `${STAGE_ID}.de1`

export const metadata = {
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
export const populatedVis = {
    type: 'LINE_LIST',
    outputType: 'EVENT',
    digitGroupSeparator: 'SPACE',
    columns: [],
    rows: [],
    filters: [],
} as unknown as CurrentVisualization
