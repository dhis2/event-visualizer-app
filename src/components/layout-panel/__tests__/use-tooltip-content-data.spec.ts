import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LayoutDimension } from '../chip'
import { useTooltipContentData } from '../use-tooltip-content-data'
import { useAddMetadata } from '@hooks'
import {
    visUiConfigSlice,
    type VisUiConfigState,
} from '@store/vis-ui-config-slice'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'

const baseDimension: LayoutDimension = {
    id: 'dx',
    dimensionId: 'dx',
    name: 'Data',
}

const createVisUiConfigState = (
    overrides: Partial<VisUiConfigState> = {}
): VisUiConfigState => ({
    visualizationType: 'LINE_LIST',
    outputType: 'EVENT',
    layout: {
        columns: [],
        filters: [],
        rows: [],
    },
    itemsByDimension: {},
    conditionsByDimension: {},
    options: {},
    ...overrides,
})

describe('useTooltipContentData', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('basic functionality', () => {
        it('returns empty data for dimension with no items', async () => {
            const { result } = await renderHookWithAppWrapper(
                () => useTooltipContentData(baseDimension),
                {
                    partialStore: {
                        reducer: {
                            visUiConfig: visUiConfigSlice.reducer,
                        },
                        preloadedState: {
                            visUiConfig: createVisUiConfigState(),
                        },
                    },
                }
            )

            expect(result.current).toEqual({
                programName: '',
                stageName: '',
                itemDisplayNames: [],
            })
        })

        it('returns data element names when metadata is available', async () => {
            const { result } = await renderHookWithAppWrapper(
                () => ({
                    tooltipData: useTooltipContentData(baseDimension),
                    addMetadata: useAddMetadata(),
                }),
                {
                    partialStore: {
                        reducer: {
                            visUiConfig: visUiConfigSlice.reducer,
                        },
                        preloadedState: {
                            visUiConfig: createVisUiConfigState({
                                itemsByDimension: {
                                    dx: ['DE1', 'DE2'],
                                },
                            }),
                        },
                    },
                }
            )

            // Initially shows IDs since metadata is not loaded
            expect(result.current.tooltipData.itemDisplayNames).toEqual([
                'DE1',
                'DE2',
            ])

            // Add metadata
            act(() => {
                result.current.addMetadata({
                    uid: 'DE1',
                    name: 'Data Element 1',
                })
                result.current.addMetadata({
                    uid: 'DE2',
                    name: 'Data Element 2',
                })
            })

            // Now shows names
            expect(result.current.tooltipData.itemDisplayNames).toEqual([
                'Data Element 1',
                'Data Element 2',
            ])
        })

        it('returns program and stage names when available', async () => {
            const programDimension: LayoutDimension = {
                id: 'programUid.stageUid.dimensionUid',
                dimensionId: 'dimensionUid',
                name: 'Program',
            }

            const { result } = await renderHookWithAppWrapper(
                () => ({
                    tooltipData: useTooltipContentData(programDimension),
                    addMetadata: useAddMetadata(),
                }),
                {
                    partialStore: {
                        reducer: {
                            visUiConfig: visUiConfigSlice.reducer,
                        },
                        preloadedState: {
                            visUiConfig: createVisUiConfigState(),
                        },
                    },
                    metadata: {
                        programUid: {
                            id: 'programUid',
                            name: 'Test Program',
                            programType: 'WITHOUT_REGISTRATION',
                            programStages: [
                                {
                                    id: 'stageUid',
                                    name: 'Test Stage',
                                    repeatable: true,
                                },
                            ],
                        },
                    },
                }
            )

            expect(result.current.tooltipData.programName).toBe('Test Program')
            expect(result.current.tooltipData.stageName).toBe('Test Stage')
        })

        it('handles organisation unit levels', async () => {
            const { result } = await renderHookWithAppWrapper(
                () => ({
                    tooltipData: useTooltipContentData(baseDimension),
                    addMetadata: useAddMetadata(),
                }),
                {
                    partialStore: {
                        reducer: {
                            visUiConfig: visUiConfigSlice.reducer,
                        },
                        preloadedState: {
                            visUiConfig: createVisUiConfigState({
                                itemsByDimension: {
                                    dx: ['LEVEL-1', 'LEVEL-2'],
                                },
                            }),
                        },
                    },
                }
            )

            // Initially shows level IDs
            expect(result.current.tooltipData.itemDisplayNames).toEqual([
                'Levels: 1, 2',
            ])

            // Add level metadata
            act(() => {
                result.current.addMetadata({
                    uid: '1',
                    name: 'National',
                })
                result.current.addMetadata({
                    uid: '2',
                    name: 'District',
                })
            })

            // Now shows level names
            expect(result.current.tooltipData.itemDisplayNames).toEqual([
                'Levels: National, District',
            ])
        })

        it('handles organisation unit groups', async () => {
            const { result } = await renderHookWithAppWrapper(
                () => ({
                    tooltipData: useTooltipContentData(baseDimension),
                    addMetadata: useAddMetadata(),
                }),
                {
                    partialStore: {
                        reducer: {
                            visUiConfig: visUiConfigSlice.reducer,
                        },
                        preloadedState: {
                            visUiConfig: createVisUiConfigState({
                                itemsByDimension: {
                                    dx: ['OU_GROUP-group1', 'OU_GROUP-group2'],
                                },
                            }),
                        },
                    },
                }
            )

            // Initially shows group IDs
            expect(result.current.tooltipData.itemDisplayNames).toEqual([
                'Groups: group1, group2',
            ])

            // Add group metadata
            act(() => {
                result.current.addMetadata({
                    uid: 'group1',
                    name: 'Group One',
                })
                result.current.addMetadata({
                    uid: 'group2',
                    name: 'Group Two',
                })
            })

            // Now shows group names
            expect(result.current.tooltipData.itemDisplayNames).toEqual([
                'Groups: Group One, Group Two',
            ])
        })

        it('handles date ranges', async () => {
            const { result } = await renderHookWithAppWrapper(
                () => useTooltipContentData(baseDimension),
                {
                    partialStore: {
                        reducer: {
                            visUiConfig: visUiConfigSlice.reducer,
                        },
                        preloadedState: {
                            visUiConfig: createVisUiConfigState({
                                itemsByDimension: {
                                    dx: ['2023-01-01_2023-12-31'],
                                },
                            }),
                        },
                    },
                }
            )

            // Date ranges should be formatted
            expect(result.current.itemDisplayNames).toEqual([
                'January 1, 2023 - December 31, 2023',
            ])
        })

        it('combines different item types', async () => {
            const { result } = await renderHookWithAppWrapper(
                () => ({
                    tooltipData: useTooltipContentData(baseDimension),
                    addMetadata: useAddMetadata(),
                }),
                {
                    partialStore: {
                        reducer: {
                            visUiConfig: visUiConfigSlice.reducer,
                        },
                        preloadedState: {
                            visUiConfig: createVisUiConfigState({
                                itemsByDimension: {
                                    dx: ['DE1', 'LEVEL-1', 'OU_GROUP-group1'],
                                },
                            }),
                        },
                    },
                }
            )

            // Initially shows IDs and formatted level/group
            expect(result.current.tooltipData.itemDisplayNames).toEqual([
                'DE1',
                'Levels: 1',
                'Groups: group1',
            ])

            // Add metadata
            act(() => {
                result.current.addMetadata({
                    uid: 'DE1',
                    name: 'Data Element 1',
                })
                result.current.addMetadata({
                    uid: '1',
                    name: 'National',
                })
                result.current.addMetadata({
                    uid: 'group1',
                    name: 'Group One',
                })
            })

            // Now shows all names
            expect(result.current.tooltipData.itemDisplayNames).toEqual([
                'Data Element 1',
                'Levels: National',
                'Groups: Group One',
            ])
        })
    })

    describe('reactive metadata updates', () => {
        it('updates when metadata is added dynamically', async () => {
            const { result } = await renderHookWithAppWrapper(
                () => ({
                    tooltipData: useTooltipContentData(baseDimension),
                    addMetadata: useAddMetadata(),
                }),
                {
                    partialStore: {
                        reducer: {
                            visUiConfig: visUiConfigSlice.reducer,
                        },
                        preloadedState: {
                            visUiConfig: createVisUiConfigState({
                                itemsByDimension: {
                                    dx: ['DE1'],
                                },
                            }),
                        },
                    },
                }
            )

            expect(result.current.tooltipData.itemDisplayNames).toEqual(['DE1'])

            act(() => {
                result.current.addMetadata({
                    uid: 'DE1',
                    name: 'Updated Data Element',
                })
            })

            expect(result.current.tooltipData.itemDisplayNames).toEqual([
                'Updated Data Element',
            ])
        })
    })
})
