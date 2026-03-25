import deepmerge from 'deepmerge'
import { describe, it, expect } from 'vitest'
import { useActionButton } from '../use-action-button'
import {
    currentVisSlice,
    initialState as currentVisInitialState,
} from '@store/current-vis-slice'
import {
    dimensionSelectionSlice,
    initialState as dimensionSelectionInitialState,
} from '@store/dimensions-selection-slice'
import {
    visUiConfigSlice,
    initialState as visUiConfigInitialState,
} from '@store/vis-ui-config-slice'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import type { RootState } from '@types'

const metadata = {
    p1: {
        id: 'p1',
        name: 'Program1',
        programType: 'WITHOUT_REGISTRATION',
    },
    p2: {
        id: 'p2',
        name: 'Program2',
        programType: 'WITH_REGISTRATION',
        trackedEntityType: { id: 'tei1' },
    },
    p1s1: {
        id: 'p1s1',
        name: 'P1 Stage1',
        repeatable: false,
        hideDueDate: false,
    },
    p1s2: {
        id: 'p1s2',
        name: 'P1 Stage2',
        repeatable: false,
        hideDueDate: false,
    },
    p2s1: {
        id: 'p2s1',
        name: 'P2 Stage1',
        repeatable: false,
        hideDueDate: false,
    },
    p2s2: {
        id: 'p2s2',
        name: 'P2 Stage2',
        repeatable: false,
        hideDueDate: false,
    },
    'p1.p1s1.d1': {
        id: 'p1.p1s1.d1',
        name: 'Dimension1',
        dimensionType: 'DATA_ELEMENT',
        optionSet: 'OptionSet1',
        valueType: 'TEXT',
    },
    'p1.p1s2.d1': {
        id: 'p1.p1s2.d1',
        name: 'Dimension1',
        dimensionType: 'DATA_ELEMENT',
        optionSet: 'OptionSet1',
        valueType: 'TEXT',
    },
    'p2.p2s1.d1': {
        id: 'p2.p2s1.d1',
        name: 'Dimension1',
        dimensionType: 'DATA_ELEMENT',
        optionSet: 'OptionSet1',
        valueType: 'TEXT',
    },
    'p2.p2s1.d2': {
        id: 'p2.p2s1.d2',
        name: 'Category',
        dimensionType: 'CATEGORY',
        valueType: 'TEXT',
    },
    'p2.p2s1.d3': {
        id: 'p2.p2s1.d3',
        name: 'Category option group set',
        dimensionType: 'CATEGORY_OPTION_GROUP_SET',
        valueType: 'TEXT',
    },
    'p2.p2s2.d1': {
        id: 'p2.p2s2.d1',
        name: 'Program indicator',
        dimensionType: 'PROGRAM_INDICATOR',
        valueType: 'TEXT',
    },
    'tei1.created': {
        id: 'tei1.created',
        name: 'Registration date',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'DATE',
    },
    'tei1.ou': {
        id: 'tei1.ou',
        name: 'Registration org. unit',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'ORGANISATION_UNIT',
    },
}

const initialPreloadedState: Partial<RootState> = {
    currentVis: currentVisInitialState,
    dimensionSelection: dimensionSelectionInitialState,
    visUiConfig: visUiConfigInitialState,
}

const createStoreWithPreloadedState = (overrides) => ({
    metadata,
    partialStore: {
        reducer: {
            currentVis: currentVisSlice.reducer,
            dimensionSelection: dimensionSelectionSlice.reducer,
            visUiConfig: visUiConfigSlice.reducer,
        },
        preloadedState: deepmerge(initialPreloadedState, overrides),
    },
})

describe('useActionButton for Event button', () => {
    it('returns correct result for: LL, currentVis with outputType !== EVENT', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('EVENT'),
            createStoreWithPreloadedState({
                currentVis: {
                    outputType: 'ENROLLMENT',
                    type: 'LINE_LIST',
                },
                dimensionSelection: {
                    dataSourceId: metadata.p1.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [metadata['p1.p1s1.d1'].id],
                    },
                    outputType: 'ENROLLMENT',
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('switch')
        expect(output.dataSourceMetadata).toEqual(metadata.p1)
        expect(output.tooltipConfig).toEqual(undefined)
    })

    it('returns correct result for: LL, currentVis with outputType === EVENT', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('EVENT'),
            createStoreWithPreloadedState({
                currentVis: {
                    outputType: 'EVENT',
                    type: 'LINE_LIST',
                },
                dimensionSelection: {
                    dataSourceId: metadata.p1.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [metadata['p1.p1s1.d1'].id],
                    },
                    outputType: 'EVENT',
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('update')
        expect(output.dataSourceMetadata).toEqual(metadata.p1)
        expect(output.tooltipConfig).toEqual(undefined)
    })

    it('returns correct result for: LL, empty layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('EVENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p1.id,
                },
                visUiConfig: {
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p1)
        expect(output.tooltipConfig).toEqual({
            content:
                'Nothing selected. Add items to the layout to get started.',
            openDelay: 1000,
        })
    })

    it('returns correct result for: LL, multiple program stages', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('EVENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p1.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [
                            metadata['p1.p1s1.d1'].id,
                            metadata['p1.p1s2.d1'].id,
                        ],
                    },
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p1)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with multiple program stages',
        })
    })

    it('returns correct result for: PT, multiple program stages', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('EVENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p1.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [
                            metadata['p1.p1s1.d1'].id,
                            metadata['p1.p1s2.d1'].id,
                        ],
                    },
                    visualizationType: 'PIVOT_TABLE',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p1)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with multiple program stages',
        })
    })

    it('returns correct result for: LL, registration date in layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('EVENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [metadata['tei1.created'].id],
                    },
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with registration date',
        })
    })

    it('returns correct result for: LL, registration org. unit in layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('EVENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [metadata['tei1.ou'].id],
                    },
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with registration org. unit',
        })
    })

    it('returns correct result for: LL, registration date and registration org. unit in layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('EVENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [
                            metadata['tei1.ou'].id,
                            metadata['tei1.created'].id,
                        ],
                    },
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content:
                'Not valid with registration date or registration org. unit',
        })
    })

    it('returns correct result for: LL, multiple programs', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('EVENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [
                            metadata['p1.p1s1.d1'].id,
                            metadata['p2.p2s1.d1'].id,
                        ],
                    },
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with multiple programs',
        })
    })

    it('returns correct result for: PT, multiple programs', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('EVENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [
                            metadata['p1.p1s1.d1'].id,
                            metadata['p2.p2s1.d1'].id,
                        ],
                    },
                    visualizationType: 'PIVOT_TABLE',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with multiple programs',
        })
    })
})

describe('useActionButton for Enrollment button', () => {
    it('returns correct result for: LL, currentVis with outputType !== ENROLLMENT', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('ENROLLMENT'),
            createStoreWithPreloadedState({
                currentVis: {
                    outputType: 'EVENT',
                    type: 'LINE_LIST',
                },
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [metadata['p2.p2s1.d1'].id],
                    },
                    outputType: 'EVENT',
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('switch')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual(undefined)
    })

    it('returns correct result for: LL, currentVis with outputType === ENROLLMENT', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('ENROLLMENT'),
            createStoreWithPreloadedState({
                currentVis: {
                    outputType: 'ENROLLMENT',
                    type: 'LINE_LIST',
                },
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [metadata['p2.p2s1.d1'].id],
                    },
                    outputType: 'ENROLLMENT',
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('update')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual(undefined)
    })

    it('returns correct result for: LL, empty layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('ENROLLMENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p1.id,
                },
                visUiConfig: {
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p1)
        expect(output.tooltipConfig).toEqual({
            content:
                'Nothing selected. Add items to the layout to get started.',
            openDelay: 1000,
        })
    })

    it('returns correct result for: LL, registration date in layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('ENROLLMENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [metadata['tei1.created'].id],
                    },
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with registration date',
        })
    })

    it('returns correct result for: LL, registration org. unit in layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('ENROLLMENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [metadata['tei1.ou'].id],
                    },
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with registration org. unit',
        })
    })

    it('returns correct result for: LL, registration date and registration org. unit in layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('ENROLLMENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [
                            metadata['tei1.ou'].id,
                            metadata['tei1.created'].id,
                        ],
                    },
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content:
                'Not valid with registration date or registration org. unit',
        })
    })

    it('returns correct result for: LL, multiple programs', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('ENROLLMENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [
                            metadata['p1.p1s1.d1'].id,
                            metadata['p2.p2s1.d1'].id,
                        ],
                    },
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with multiple programs',
        })
    })

    it('returns correct result for: PT, multiple programs', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('ENROLLMENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [
                            metadata['p1.p1s1.d1'].id,
                            metadata['p2.p2s1.d1'].id,
                        ],
                    },
                    visualizationType: 'PIVOT_TABLE',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with multiple programs',
        })
    })

    it('returns correct result for: LL, event program', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('ENROLLMENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p1.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [metadata['p1.p1s1.d1'].id],
                    },
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p1)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with event programs',
        })
    })

    it('returns correct result for: LL, category in layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('ENROLLMENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [metadata['p2.p2s1.d2'].id],
                    },
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with categories',
        })
    })

    it('returns correct result for: PT, category option group sets in layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('ENROLLMENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [metadata['p2.p2s1.d3'].id],
                    },
                    visualizationType: 'PIVOT_TABLE',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with category option group sets',
        })
    })

    it('returns correct result for: LL, category and category option group sets in layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('ENROLLMENT'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [
                            metadata['p2.p2s1.d2'].id,
                            metadata['p2.p2s1.d3'].id,
                        ],
                    },
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with categories or category option group sets',
        })
    })
})

describe('useActionButton for Tracked entity instance button', () => {
    it('returns correct result for: LL, currentVis with outputType !== TRACKED_ENTITY_INSTANCE', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('TRACKED_ENTITY_INSTANCE'),
            createStoreWithPreloadedState({
                currentVis: {
                    outputType: 'EVENT',
                    type: 'LINE_LIST',
                },
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [metadata['p2.p2s1.d1'].id],
                    },
                    outputType: 'EVENT',
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('switch')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual(undefined)
    })

    it('returns correct result for: LL, currentVis with outputType === TRACKED_ENTITY_INSTANCE', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('TRACKED_ENTITY_INSTANCE'),
            createStoreWithPreloadedState({
                currentVis: {
                    outputType: 'TRACKED_ENTITY_INSTANCE',
                    type: 'LINE_LIST',
                },
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [metadata['p2.p2s1.d1'].id],
                    },
                    outputType: 'TRACKED_ENTITY_INSTANCE',
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('update')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual(undefined)
    })

    it('returns correct result for: LL, empty layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('TRACKED_ENTITY_INSTANCE'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p1.id,
                },
                visUiConfig: {
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p1)
        expect(output.tooltipConfig).toEqual({
            content:
                'Nothing selected. Add items to the layout to get started.',
            openDelay: 1000,
        })
    })

    it('returns correct result for: PT, multiple programs', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('TRACKED_ENTITY_INSTANCE'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [
                            metadata['p1.p1s1.d1'].id,
                            metadata['p2.p2s1.d1'].id,
                        ],
                    },
                    visualizationType: 'PIVOT_TABLE',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with multiple programs',
        })
    })

    it('returns correct result for: LL, event program', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('TRACKED_ENTITY_INSTANCE'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p1.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [metadata['p1.p1s1.d1'].id],
                    },
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p1)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with event programs',
        })
    })

    it('returns correct result for: LL, category in layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('TRACKED_ENTITY_INSTANCE'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [metadata['p2.p2s1.d2'].id],
                    },
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with categories',
        })
    })

    it('returns correct result for: PT, category option group sets in layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('TRACKED_ENTITY_INSTANCE'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [metadata['p2.p2s1.d3'].id],
                    },
                    visualizationType: 'PIVOT_TABLE',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with category option group sets',
        })
    })

    it('returns correct result for: LL, category and category option group sets in layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('TRACKED_ENTITY_INSTANCE'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [
                            metadata['p2.p2s1.d2'].id,
                            metadata['p2.p2s1.d3'].id,
                        ],
                    },
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with categories or category option group sets',
        })
    })

    it('returns correct result for: LL, program indicator in layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useActionButton('TRACKED_ENTITY_INSTANCE'),
            createStoreWithPreloadedState({
                dimensionSelection: {
                    dataSourceId: metadata.p2.id,
                },
                visUiConfig: {
                    layout: {
                        columns: [
                            metadata['p2.p2s2.d1'].id,
                            metadata['p2.p2s1.d1'].id,
                        ],
                    },
                    visualizationType: 'LINE_LIST',
                },
            })
        )

        const output = result.current

        expect(output.action).toEqual('create')
        expect(output.dataSourceMetadata).toEqual(metadata.p2)
        expect(output.tooltipConfig).toEqual({
            content: 'Not valid with program indicators',
        })
    })
})
