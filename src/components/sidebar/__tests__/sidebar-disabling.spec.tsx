import {
    useAppSelector,
    useCrossTetMismatch,
    useDimensionLayoutBlockedMessage,
} from '@hooks'
import {
    initialState as dimensionSelectionInitialState,
    dimensionSelectionSlice,
    isDimensionCardCollapsed,
} from '@store/dimensions-selection-slice'
import {
    initialState as visUiConfigInitialState,
    visUiConfigSlice,
} from '@store/vis-ui-config-slice'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import type {
    DimensionCardKey,
    DimensionMetadataItem,
    InitialMetadataItems,
    RootState,
} from '@types'
import deepmerge from 'deepmerge'
import { describe, expect, it } from 'vitest'
import {
    useIsCardCrossTetBlocked,
    useSyncAutoCollapse,
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

/* A program-scope dim resolving to the data source's own TET (tetA), used to
 * exercise the "TETs match" path. */
const sameTetDimMetadata: InitialMetadataItems = {
    'progA.de1': {
        id: 'progA.de1',
        dimensionId: 'de1',
        name: 'Data element 1',
        dimensionType: 'DATA_ELEMENT',
        programId: 'progA',
    },
}

const layoutWith = (dimensionId: string) => ({
    columns: [dimensionId],
    rows: [],
    filters: [],
})

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

describe('useCrossTetMismatch', () => {
    it('returns the TET names when the data source TET differs from the layout TET', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCrossTetMismatch(),
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
                        layout: layoutWith('tetB.enrollmentOu'),
                    },
                },
            })
        )
        expect(result.current).toEqual({
            dataSourceTetName: 'Person',
            layoutTetName: 'Household',
            layoutTetId: 'tetB',
        })
    })

    it('returns null when the data source TET matches the layout TET', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCrossTetMismatch(),
            buildOptions({
                metadata: {
                    ...trackerProgramMetadata,
                    ...sameTetDimMetadata,
                },
                state: {
                    dimensionSelection: {
                        ...dimensionSelectionInitialState,
                        dataSourceId: 'progA',
                    },
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        layout: layoutWith('progA.de1'),
                    },
                },
            })
        )
        expect(result.current).toBeNull()
    })

    it('returns null for an event-program data source (no TET)', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCrossTetMismatch(),
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
                        layout: layoutWith('tetB.enrollmentOu'),
                    },
                },
            })
        )
        expect(result.current).toBeNull()
    })
})

describe('useIsCardCrossTetBlocked', () => {
    it('blocks every program-scoped card on TET mismatch, but not generic cards', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => ({
                tet: useIsCardCrossTetBlocked('program-tracked-entity-type'),
                enrollment: useIsCardCrossTetBlocked('enrollment'),
                event: useIsCardCrossTetBlocked('event-with-registration'),
                pi: useIsCardCrossTetBlocked('enrollment-program-indicators'),
                metadata: useIsCardCrossTetBlocked('metadata'),
                other: useIsCardCrossTetBlocked('other'),
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
                        layout: layoutWith('tetB.enrollmentOu'),
                    },
                },
            })
        )
        expect(result.current).toEqual({
            tet: true,
            enrollment: true,
            event: true,
            pi: true,
            metadata: false,
            other: false,
        })
    })

    it('blocks only the tracked-entity-type card for a TET data source', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useIsCardCrossTetBlocked('tracked-entity-type'),
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
                        layout: layoutWith('tetB.enrollmentOu'),
                    },
                },
            })
        )
        expect(result.current).toBe(true)
    })

    it('returns false when the TETs match', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useIsCardCrossTetBlocked('enrollment'),
            buildOptions({
                metadata: {
                    ...trackerProgramMetadata,
                    ...sameTetDimMetadata,
                },
                state: {
                    dimensionSelection: {
                        ...dimensionSelectionInitialState,
                        dataSourceId: 'progA',
                    },
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        layout: layoutWith('progA.de1'),
                    },
                },
            })
        )
        expect(result.current).toBe(false)
    })
})

describe('useSyncAutoCollapse', () => {
    const renderSync = (cardKey: DimensionCardKey, options: unknown) =>
        renderHookWithAppWrapper(
            () => {
                useSyncAutoCollapse(cardKey)
                return useAppSelector((state) =>
                    isDimensionCardCollapsed(state, cardKey)
                )
            },
            options as Parameters<typeof renderHookWithAppWrapper>[1]
        )

    it('collapses an affected card on TET mismatch', async () => {
        const { result } = await renderSync(
            'enrollment',
            buildOptions({
                metadata: {
                    ...trackerProgramMetadata,
                    ...differentTetDimMetadata,
                },
                state: {
                    dimensionSelection: {
                        ...dimensionSelectionInitialState,
                        dataSourceId: 'progA',
                        dimensionCardCollapsedStates: { enrollment: false },
                    },
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        layout: layoutWith('tetB.enrollmentOu'),
                    },
                },
            })
        )
        expect(result.current).toBe(true)
    })

    it('re-expands a collapsed card once it has no reason to stay collapsed', async () => {
        const { result } = await renderSync(
            'enrollment',
            buildOptions({
                metadata: {
                    ...trackerProgramMetadata,
                    ...sameTetDimMetadata,
                },
                state: {
                    dimensionSelection: {
                        ...dimensionSelectionInitialState,
                        dataSourceId: 'progA',
                        dimensionCardCollapsedStates: { enrollment: true },
                    },
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        layout: layoutWith('progA.de1'),
                    },
                },
            })
        )
        expect(result.current).toBe(false)
    })

    it('collapses a program-indicators card outside line list', async () => {
        const { result } = await renderSync(
            'enrollment-program-indicators',
            buildOptions({
                metadata: trackerProgramMetadata,
                state: {
                    dimensionSelection: {
                        ...dimensionSelectionInitialState,
                        dataSourceId: 'progA',
                        dimensionCardCollapsedStates: {
                            'enrollment-program-indicators': false,
                        },
                    },
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'PIVOT_TABLE',
                    },
                },
            })
        )
        expect(result.current).toBe(true)
    })

    it('leaves a program-indicators card expanded in line list', async () => {
        const { result } = await renderSync(
            'enrollment-program-indicators',
            buildOptions({
                metadata: trackerProgramMetadata,
                state: {
                    dimensionSelection: {
                        ...dimensionSelectionInitialState,
                        dataSourceId: 'progA',
                        dimensionCardCollapsedStates: {
                            'enrollment-program-indicators': false,
                        },
                    },
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'LINE_LIST',
                    },
                },
            })
        )
        expect(result.current).toBe(false)
    })
})

describe('useDimensionLayoutBlockedMessage', () => {
    it('returns null when no rule applies', async () => {
        const dim = makeDim({ id: 'stage1.de1', dimensionId: 'de1' })
        const { result } = await renderHookWithAppWrapper(
            () => useDimensionLayoutBlockedMessage(dim),
            buildOptions({
                state: {
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'LINE_LIST',
                    },
                },
            })
        )
        expect(result.current).toBeNull()
    })

    it('returns the custom-value message when the dim matches the configured custom value id', async () => {
        const dim = makeDim({ id: 'stage1.de1', dimensionId: 'de1' })
        const { result } = await renderHookWithAppWrapper(
            () => useDimensionLayoutBlockedMessage(dim),
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
            () => useDimensionLayoutBlockedMessage(dim),
            buildOptions({
                state: {
                    visUiConfig: {
                        ...visUiConfigInitialState,
                        visualizationType: 'PIVOT_TABLE',
                    },
                },
            })
        )
        expect(result.current).toMatch(/Cannot be used in a Pivot table/)
    })

    it('returns the cross-TET message when the dim TET differs from the layout TET', async () => {
        const dim = makeDim({
            id: 'progA.de1',
            dimensionId: 'de1',
            programId: 'progA',
        })
        const { result } = await renderHookWithAppWrapper(
            () => useDimensionLayoutBlockedMessage(dim),
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
                        layout: layoutWith('tetB.enrollmentOu'),
                    },
                },
            })
        )
        expect(result.current).toMatch(/cannot be combined with/)
    })
})
