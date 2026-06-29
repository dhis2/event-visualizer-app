import {
    useAppDispatch,
    useAppSelector,
    useAddMetadata,
    useMetadataStore,
} from '@hooks'
import { clearMultiSelection } from '@store/dimensions-selection-slice'
import {
    addVisUiConfigLayoutDimension,
    addVisUiConfigLayoutDimensions,
    moveVisUiConfigLayoutDimension,
} from '@store/vis-ui-config-slice'
import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { LayoutDragEndEvent } from '../types'
import { useOnDragEnd } from '../use-on-drag-end'

vi.mock('@dhis2/app-runtime', () => ({
    useAlert: vi.fn(() => ({ show: vi.fn() })),
}))

vi.mock('@components/sidebar/sidebar-disabling', () => ({
    getDimensionBlockReason: vi.fn(() => null),
    resolveCrossTetMismatch: vi.fn(() => null),
}))

const mockStoreGetState = vi.fn(() => ({}))

vi.mock('@hooks', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
    useAddMetadata: vi.fn(),
    useAppStore: vi.fn(() => ({ getState: mockStoreGetState })),
    useListFormatter: vi.fn(() => ({
        format: (list: string[]) => list.join(', '),
    })),
    useMetadataStore: vi.fn(() => ({
        getMetadataItem: vi.fn(() => undefined),
    })),
}))

vi.mock('@store/dimensions-selection-slice', () => ({
    clearMultiSelection: vi.fn(),
    getMultiSelectedDimensionIds: vi.fn(),
}))

vi.mock('@store/vis-ui-config-slice', () => ({
    addVisUiConfigLayoutDimension: vi.fn(),
    addVisUiConfigLayoutDimensions: vi.fn(),
    moveVisUiConfigLayoutDimension: vi.fn(),
    getVisUiConfigVisualizationType: vi.fn(),
    getVisUiConfigCustomValue: vi.fn(),
}))

describe('useOnDragEnd', () => {
    const mockDispatch = vi.fn()
    const mockAddMetadata = vi.fn()

    beforeEach(() => {
        vi.mocked(useAppDispatch).mockReturnValue(mockDispatch)
        vi.mocked(useAppSelector).mockReturnValue([])
        vi.mocked(useAddMetadata).mockReturnValue(mockAddMetadata)
        mockDispatch.mockClear()
        mockAddMetadata.mockClear()
    })

    it('should do nothing if event.active.data.current is missing', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const event = {
            active: { data: { current: null } },
            over: null,
        } as unknown as LayoutDragEndEvent

        result.current(event)

        expect(mockDispatch).not.toHaveBeenCalled()
        expect(mockAddMetadata).not.toHaveBeenCalled()
    })

    it('should do nothing if event.over is missing', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const event = {
            active: { data: { current: { dimensionId: 'test' } } },
            over: null,
        } as unknown as LayoutDragEndEvent

        result.current(event)

        expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('should do nothing if event.over.data.current.axis is missing', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const event = {
            active: { data: { current: { dimensionId: 'test' } } },
            over: { data: { current: {} } },
        } as unknown as LayoutDragEndEvent

        result.current(event)

        expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('should dispatch addVisUiConfigLayoutDimension for sidebar drag to empty axis', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const populateMetadata = vi.fn()
        const event = {
            active: {
                data: {
                    current: {
                        dimensionId: 'test',
                        overlayItemProps: {},
                        populateMetadata,
                        isLayoutBlocked: false,
                    },
                },
            },
            over: {
                data: {
                    current: {
                        axis: 'columns',
                        sortable: { index: 0 },
                        insertAfter: false,
                    },
                },
            },
        } as unknown as LayoutDragEndEvent

        result.current(event)

        expect(mockDispatch).toHaveBeenCalledWith(
            addVisUiConfigLayoutDimension({
                axis: 'columns',
                dimensionId: 'test',
                insertIndex: 0,
                insertAfter: false,
            })
        )
    })

    it('should dispatch moveVisUiConfigLayoutDimension for axis to axis move', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const event = {
            active: {
                data: {
                    current: {
                        dimensionId: 'test',
                        axis: 'rows',
                        sortable: { index: 1 },
                        overlayItemProps: {},
                        insertAfter: false,
                        isLayoutBlocked: false,
                    },
                },
            },
            over: {
                data: {
                    current: {
                        axis: 'columns',
                        sortable: { index: 2 },
                        insertAfter: true,
                    },
                },
            },
        } as unknown as LayoutDragEndEvent

        result.current(event)

        expect(mockDispatch).toHaveBeenCalledWith(
            moveVisUiConfigLayoutDimension({
                dimensionId: 'test',
                sourceAxis: 'rows',
                targetAxis: 'columns',
                sourceIndex: 1,
                targetIndex: 2,
                insertAfter: true,
            })
        )
    })

    it('should dispatch addVisUiConfigLayoutDimensions for multi-select drag', () => {
        vi.mocked(useAppSelector).mockReturnValue(['dim1', 'dim2', 'dim3'])
        vi.mocked(useMetadataStore).mockReturnValue({
            getMetadataItem: vi.fn((id: string) => ({
                id,
                dimensionType: 'DATA_ELEMENT',
            })),
        } as unknown as ReturnType<typeof useMetadataStore>)
        const { result } = renderHook(() => useOnDragEnd())
        const populateMetadata = vi.fn()
        const event = {
            active: {
                data: {
                    current: {
                        dimensionId: 'dim2',
                        overlayItemProps: {},
                        populateMetadata,
                        isLayoutBlocked: false,
                    },
                },
            },
            over: {
                data: {
                    current: {
                        axis: 'rows',
                        sortable: { index: 1 },
                        insertAfter: false,
                    },
                },
            },
        } as unknown as LayoutDragEndEvent

        result.current(event)

        expect(populateMetadata).not.toHaveBeenCalled()
        expect(mockDispatch).toHaveBeenCalledWith(
            addVisUiConfigLayoutDimensions({
                axis: 'rows',
                dimensionIds: ['dim1', 'dim2', 'dim3'],
                insertIndex: 1,
                insertAfter: false,
            })
        )
        expect(mockDispatch).toHaveBeenCalledWith(clearMultiSelection())
    })

    it('should use single add when dragged item is not in multi-selection', () => {
        vi.mocked(useAppSelector).mockReturnValue(['dim1', 'dim2'])
        const { result } = renderHook(() => useOnDragEnd())
        const populateMetadata = vi.fn()
        const event = {
            active: {
                data: {
                    current: {
                        dimensionId: 'dim3',
                        overlayItemProps: {},
                        populateMetadata,
                        isLayoutBlocked: false,
                    },
                },
            },
            over: {
                data: {
                    current: {
                        axis: 'columns',
                        sortable: { index: 0 },
                        insertAfter: false,
                    },
                },
            },
        } as unknown as LayoutDragEndEvent

        result.current(event)

        expect(populateMetadata).toHaveBeenCalled()
        expect(mockDispatch).toHaveBeenCalledWith(
            addVisUiConfigLayoutDimension({
                axis: 'columns',
                dimensionId: 'dim3',
                insertIndex: 0,
                insertAfter: false,
            })
        )
        expect(mockDispatch).toHaveBeenCalledWith(clearMultiSelection())
    })

    it('should clear multi-selection after any sidebar drop', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const populateMetadata = vi.fn()
        const event = {
            active: {
                data: {
                    current: {
                        dimensionId: 'test',
                        overlayItemProps: {},
                        populateMetadata,
                        isLayoutBlocked: false,
                    },
                },
            },
            over: {
                data: {
                    current: {
                        axis: 'columns',
                        sortable: { index: 0 },
                        insertAfter: false,
                    },
                },
            },
        } as unknown as LayoutDragEndEvent

        result.current(event)

        expect(mockDispatch).toHaveBeenCalledWith(clearMultiSelection())
    })

    it('should forward sortable index for insert-before operations without adjustment', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const event = {
            active: {
                data: {
                    current: {
                        dimensionId: 'test',
                        axis: 'rows',
                        sortable: { index: 1 },
                        overlayItemProps: {},
                        insertAfter: false,
                        isLayoutBlocked: false,
                    },
                },
            },
            over: {
                data: {
                    current: {
                        axis: 'columns',
                        sortable: { index: 3 },
                        insertAfter: false,
                    },
                },
            },
        } as unknown as LayoutDragEndEvent

        result.current(event)

        expect(mockDispatch).toHaveBeenCalledWith(
            moveVisUiConfigLayoutDimension({
                dimensionId: 'test',
                sourceAxis: 'rows',
                targetAxis: 'columns',
                sourceIndex: 1,
                targetIndex: 3,
                insertAfter: false,
            })
        )
    })
})
