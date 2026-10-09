import {
    visUiConfigSlice,
    type VisUiConfigState,
} from '@store/vis-ui-config-slice'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import { describe, expect, it } from 'vitest'
import type { LayoutDimension } from '../chip'
import { useTooltipContentData } from '../use-tooltip-content-data'

const baseDimension: LayoutDimension = {
    id: 'dx',
    dimensionId: 'dx',
    dimensionType: 'DATA_ELEMENT',
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
    repetitionsByDimension: {},
    options: {},
    ...overrides,
})

describe('useTooltipContentData', () => {
    it('returns empty names for a dimension without program context', async () => {
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
        })
    })

    it('returns program and stage names when available', async () => {
        const programDimension: LayoutDimension = {
            id: 'programUid.stageUid.dimensionUid',
            dimensionId: 'dimensionUid',
            dimensionType: 'DATA_ELEMENT',
            programId: 'programUid',
            programStageId: 'stageUid',
            name: 'Program',
        }

        const { result } = await renderHookWithAppWrapper(
            () => useTooltipContentData(programDimension),
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

        expect(result.current.programName).toBe('Test Program')
        expect(result.current.stageName).toBe('Test Stage')
    })
})
