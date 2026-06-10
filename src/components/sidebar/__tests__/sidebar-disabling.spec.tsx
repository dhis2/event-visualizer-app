import {
    initialState as dimensionSelectionInitialState,
    dimensionSelectionSlice,
} from '@store/dimensions-selection-slice'
import {
    initialState as visUiConfigInitialState,
    visUiConfigSlice,
} from '@store/vis-ui-config-slice'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import type {
    DimensionMetadataItem,
    InitialMetadataItems,
    RootState,
} from '@types'
import deepmerge from 'deepmerge'
import { describe, expect, it } from 'vitest'
import {
    useCardDisabledNoticeText,
    useDimensionDisabledText,
    useIsCardDisabledByLayout,
} from '../sidebar-disabling'

const trackerProgramMetadata = {
    progA: {
        id: 'progA',
        name: 'Tracker A',
        programType: 'WITH_REGISTRATION',
        trackedEntityType: { id: 'tetA', name: 'Person' },
    },
}

const eventProgramMetadata = {
    evtA: {
        id: 'evtA',
        name: 'Event A',
        programType: 'WITHOUT_REGISTRATION',
    },
}

const differentTetDimMetadata: InitialMetadataItems = {
    tetB: { id: 'tetB', name: 'Household' },
    'tetB.enrollmentOu': {
        id: 'tetB.enrollmentOu',
        dimensionId: 'enrollmentOu',
        name: 'Registration org. unit',
        dimensionType: 'ORGANISATION_UNIT',
        trackedEntityTypeId: 'tetB',
    },
}

const initialPreloadedState: Partial<RootState> = {
    dimensionSelection: dimensionSelectionInitialState,
    visUiConfig: visUiConfigInitialState,
}

const buildOptions = ({
    state,
    metadata,
}: {
    state?: Partial<RootState>
    metadata?: InitialMetadataItems
} = {}) => ({
    metadata,
    partialStore: {
        reducer: {
            dimensionSelection: dimensionSelectionSlice.reducer,
            visUiConfig: visUiConfigSlice.reducer,
        },
        preloadedState: deepmerge(initialPreloadedState, state ?? {}),
    },
})

describe('useIsCardDisabledByLayout', () => {
    it('returns false for all program-scoped cards when LL + matching TET', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => ({
                enrollment: useIsCardDisabledByLayout('enrollment'),
                event: useIsCardDisabledByLayout('event-with-registration'),
                tet: useIsCardDisabledByLayout('program-tracked-entity-type'),
                pi: useIsCardDisabledByLayout('enrollment-program-indicators'),
            }),
            buildOptions({
                metadata: trackerProgramMetadata,
                state: {
                    dimensionSelection: {
                        ...dimensionSelectionInitialState,
                        dataSourceId: 'progA',
                    },
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'LINE_LIST',
                    },
                },
            })
        )
        expect(result.current).toEqual({
            enrollment: false,
            event: false,
            tet: false,
            pi: false,
        })
    })

    it('returns true for the PI card when vis is PIVOT_TABLE', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => ({
                enrollment: useIsCardDisabledByLayout('enrollment'),
                pi: useIsCardDisabledByLayout('enrollment-program-indicators'),
            }),
            buildOptions({
                metadata: trackerProgramMetadata,
                state: {
                    dimensionSelection: {
                        ...dimensionSelectionInitialState,
                        dataSourceId: 'progA',
                    },
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'PIVOT_TABLE',
                    },
                },
            })
        )
        expect(result.current.enrollment).toBe(false)
        expect(result.current.pi).toBe(true)
    })

    it('returns true for every program-scoped card when layout TET differs', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => ({
                enrollment: useIsCardDisabledByLayout('enrollment'),
                event: useIsCardDisabledByLayout('event-with-registration'),
                tet: useIsCardDisabledByLayout('program-tracked-entity-type'),
                pi: useIsCardDisabledByLayout('enrollment-program-indicators'),
            }),
            buildOptions({
                metadata: {
                    ...trackerProgramMetadata,
                    ...differentTetDimMetadata,
                },
                state: {
                    dimensionSelection: {
                        ...dimensionSelectionInitialState,
                        dataSourceId: 'progA',
                    },
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'LINE_LIST',
                        layout: {
                            columns: ['tetB.enrollmentOu'],
                            rows: [],
                            filters: [],
                        },
                    },
                },
            })
        )
        expect(result.current).toEqual({
            enrollment: true,
            event: true,
            tet: true,
            pi: true,
        })
    })

    it('returns false for event-program cards (no TET on data source) regardless of layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => ({
                event: useIsCardDisabledByLayout('event-without-registration'),
                pi: useIsCardDisabledByLayout('event-program-indicators'),
            }),
            buildOptions({
                metadata: {
                    ...eventProgramMetadata,
                    ...differentTetDimMetadata,
                },
                state: {
                    dimensionSelection: {
                        ...dimensionSelectionInitialState,
                        dataSourceId: 'evtA',
                    },
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'LINE_LIST',
                        layout: {
                            columns: ['tetB.enrollmentOu'],
                            rows: [],
                            filters: [],
                        },
                    },
                },
            })
        )
        expect(result.current.event).toBe(false)
        expect(result.current.pi).toBe(false)
    })

    it('returns false when no data source is selected', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useIsCardDisabledByLayout('enrollment'),
            buildOptions({
                state: {
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'PIVOT_TABLE',
                    },
                },
            })
        )
        expect(result.current).toBe(false)
    })

    it('returns false for non-sidebar card ids (metadata, other)', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => ({
                metadata: useIsCardDisabledByLayout('metadata'),
                other: useIsCardDisabledByLayout('other'),
            }),
            buildOptions({
                metadata: trackerProgramMetadata,
                state: {
                    dimensionSelection: {
                        ...dimensionSelectionInitialState,
                        dataSourceId: 'progA',
                    },
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'PIVOT_TABLE',
                    },
                },
            })
        )
        expect(result.current.metadata).toBe(false)
        expect(result.current.other).toBe(false)
    })
})

describe('useCardDisabledNoticeText', () => {
    it('returns the message only for the first disabled card in iteration order', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => ({
                enrollment: useCardDisabledNoticeText('enrollment'),
                event: useCardDisabledNoticeText('event-with-registration'),
                tet: useCardDisabledNoticeText('program-tracked-entity-type'),
                pi: useCardDisabledNoticeText('enrollment-program-indicators'),
            }),
            buildOptions({
                metadata: {
                    ...trackerProgramMetadata,
                    ...differentTetDimMetadata,
                },
                state: {
                    dimensionSelection: {
                        ...dimensionSelectionInitialState,
                        dataSourceId: 'progA',
                    },
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'LINE_LIST',
                        layout: {
                            columns: ['tetB.enrollmentOu'],
                            rows: [],
                            filters: [],
                        },
                    },
                },
            })
        )
        expect(result.current.enrollment).toMatch(/Household/)
        expect(result.current.event).toBeUndefined()
        expect(result.current.tet).toBeUndefined()
        expect(result.current.pi).toBeUndefined()
    })

    it('returns the message on the PI card only when vis is PIVOT_TABLE (same TET)', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => ({
                enrollment: useCardDisabledNoticeText('enrollment'),
                pi: useCardDisabledNoticeText('enrollment-program-indicators'),
            }),
            buildOptions({
                metadata: trackerProgramMetadata,
                state: {
                    dimensionSelection: {
                        ...dimensionSelectionInitialState,
                        dataSourceId: 'progA',
                    },
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'PIVOT_TABLE',
                    },
                },
            })
        )
        expect(result.current.enrollment).toBeUndefined()
        expect(result.current.pi).toMatch(/Cannot be used with Pivot table/)
    })

    it('returns undefined for non-sidebar card ids (metadata, other)', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => ({
                metadata: useCardDisabledNoticeText('metadata'),
                other: useCardDisabledNoticeText('other'),
            }),
            buildOptions({
                metadata: trackerProgramMetadata,
                state: {
                    dimensionSelection: {
                        ...dimensionSelectionInitialState,
                        dataSourceId: 'progA',
                    },
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'PIVOT_TABLE',
                    },
                },
            })
        )
        expect(result.current.metadata).toBeUndefined()
        expect(result.current.other).toBeUndefined()
    })

    it('different-TET wins over vis-type when both could fire in a with-registration suite', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => ({
                enrollment: useCardDisabledNoticeText('enrollment'),
                pi: useCardDisabledNoticeText('enrollment-program-indicators'),
                enrollmentDisabled: useIsCardDisabledByLayout('enrollment'),
                piDisabled: useIsCardDisabledByLayout(
                    'enrollment-program-indicators'
                ),
            }),
            buildOptions({
                metadata: {
                    ...trackerProgramMetadata,
                    ...differentTetDimMetadata,
                },
                state: {
                    dimensionSelection: {
                        ...dimensionSelectionInitialState,
                        dataSourceId: 'progA',
                    },
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'PIVOT_TABLE',
                        layout: {
                            columns: ['tetB.enrollmentOu'],
                            rows: [],
                            filters: [],
                        },
                    },
                },
            })
        )
        // notice is the different-TET one, hosted by enrollment (not PI)
        expect(result.current.enrollment).toMatch(/Household/)
        expect(result.current.pi).toBeUndefined()
        // both cards are dimmed
        expect(result.current.enrollmentDisabled).toBe(true)
        expect(result.current.piDisabled).toBe(true)
    })

    it('returns the different-TET message on the standalone TET card', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCardDisabledNoticeText('tracked-entity-type'),
            buildOptions({
                metadata: {
                    tetA: { id: 'tetA', name: 'Person' },
                    ...differentTetDimMetadata,
                },
                state: {
                    dimensionSelection: {
                        ...dimensionSelectionInitialState,
                        dataSourceId: 'tetA',
                    },
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'LINE_LIST',
                        layout: {
                            columns: ['tetB.enrollmentOu'],
                            rows: [],
                            filters: [],
                        },
                    },
                },
            })
        )
        expect(result.current).toMatch(/Household/)
    })

    it('returns the vis-type message on the event-program PI card in pivot mode', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCardDisabledNoticeText('event-program-indicators'),
            buildOptions({
                metadata: eventProgramMetadata,
                state: {
                    dimensionSelection: {
                        ...dimensionSelectionInitialState,
                        dataSourceId: 'evtA',
                    },
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'PIVOT_TABLE',
                    },
                },
            })
        )
        expect(result.current).toMatch(/Cannot be used with Pivot table/)
    })
})

const makeDim = (
    overrides: Partial<DimensionMetadataItem>
): DimensionMetadataItem =>
    ({
        id: overrides.id ?? 'fallback.id',
        dimensionId: overrides.dimensionId ?? 'fallback',
        name: overrides.name ?? 'Fallback',
        dimensionType: overrides.dimensionType ?? 'DATA_ELEMENT',
        ...overrides,
    }) as DimensionMetadataItem

describe('useDimensionDisabledText', () => {
    it('returns undefined when no rule applies', async () => {
        const dim = makeDim({ id: 'stage1.de1', dimensionId: 'de1' })
        const { result } = await renderHookWithAppWrapper(
            () => useDimensionDisabledText(dim),
            buildOptions({
                state: {
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'LINE_LIST',
                    },
                },
            })
        )
        expect(result.current).toBeUndefined()
    })

    it('returns the custom-value message when the dim matches the configured custom value id', async () => {
        const dim = makeDim({ id: 'stage1.de1', dimensionId: 'de1' })
        const { result } = await renderHookWithAppWrapper(
            () => useDimensionDisabledText(dim),
            buildOptions({
                state: {
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'PIVOT_TABLE',
                        customValue: {
                            id: 'stage1.de1',
                            aggregationType: 'SUM',
                        },
                    },
                },
            })
        )
        expect(result.current).toMatch(/custom value/)
    })

    it('returns the vis-type message for the TET registration OU outside line list', async () => {
        const dim = makeDim({
            id: 'tetA.enrollmentOu',
            dimensionId: 'enrollmentOu',
            dimensionType: 'ORGANISATION_UNIT',
            trackedEntityTypeId: 'tetA',
        })
        const { result } = await renderHookWithAppWrapper(
            () => useDimensionDisabledText(dim),
            buildOptions({
                state: {
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'PIVOT_TABLE',
                    },
                },
            })
        )
        expect(result.current).toMatch(/Not valid with Pivot table/)
    })
})
