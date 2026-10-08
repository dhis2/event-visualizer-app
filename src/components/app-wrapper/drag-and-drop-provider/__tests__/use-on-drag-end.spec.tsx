import { useAlert } from '@dhis2/app-runtime'
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
    removeVisUiConfigLayoutDimensionFromAxis,
    setVisUiConfigCellValue,
} from '@store/vis-ui-config-slice'
import { createMetadataStoreStub } from '@test-utils/metadata-store-stub'
import { renderHook } from '@testing-library/react'
import type { DimensionMetadataItem } from '@types'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { LayoutDragEndEvent } from '../types'
import { useOnDragEnd } from '../use-on-drag-end'

vi.mock('@dhis2/app-runtime', () => ({
    useAlert: vi.fn(() => ({ show: vi.fn() })),
}))

vi.mock('@components/sidebar/sidebar-disabling', () => ({
    getDimensionBlockReason: vi.fn(() => null),
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
    useMetadataStore: vi.fn(() => createMetadataStoreStub()),
}))

vi.mock('@store/dimensions-selection-slice', () => ({
    clearMultiSelection: vi.fn(),
    getMultiSelectedDimensionIds: vi.fn(),
}))

vi.mock('@store/vis-ui-config-slice', () => ({
    addVisUiConfigLayoutDimension: vi.fn(),
    addVisUiConfigLayoutDimensions: vi.fn(),
    moveVisUiConfigLayoutDimension: vi.fn(),
    removeVisUiConfigLayoutDimensionFromAxis: vi.fn(),
    setVisUiConfigCellValue: vi.fn(),
    getVisUiConfigVisualizationType: vi.fn(),
    getVisUiConfigLayoutAllDimensionIds: vi.fn(() => []),
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

    it('should do nothing when a chip is dropped back on its own slot', () => {
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
                        dimensionId: 'test',
                        axis: 'rows',
                        sortable: { index: 1 },
                        insertAfter: false,
                    },
                },
            },
        } as unknown as LayoutDragEndEvent

        result.current(event)

        expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('removes a chip that is dropped outside any axis', () => {
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
            over: null,
        } as unknown as LayoutDragEndEvent

        result.current(event)

        expect(mockDispatch).toHaveBeenCalledWith(
            removeVisUiConfigLayoutDimensionFromAxis({
                axis: 'rows',
                dimensionId: 'test',
            })
        )
    })

    it('removes a chip that is dropped over a non-axis target', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const event = {
            active: {
                data: {
                    current: {
                        dimensionId: 'test',
                        axis: 'columns',
                        sortable: { index: 0 },
                        overlayItemProps: {},
                        insertAfter: false,
                        isLayoutBlocked: false,
                    },
                },
            },
            over: {
                data: {
                    current: {
                        dimensionId: 'sidebar-dim',
                        overlayItemProps: {},
                        populateMetadata: vi.fn(),
                    },
                },
            },
        } as unknown as LayoutDragEndEvent

        result.current(event)

        expect(mockDispatch).toHaveBeenCalledWith(
            removeVisUiConfigLayoutDimensionFromAxis({
                axis: 'columns',
                dimensionId: 'test',
            })
        )
    })

    it('does not remove anything when a sidebar item is dropped outside any axis', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const event = {
            active: {
                data: {
                    current: {
                        dimensionId: 'test',
                        overlayItemProps: {},
                        populateMetadata: vi.fn(),
                    },
                },
            },
            over: null,
        } as unknown as LayoutDragEndEvent

        result.current(event)

        expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('should dispatch addVisUiConfigLayoutDimensions for multi-select drag', () => {
        vi.mocked(useAppSelector).mockReturnValue(['dim1', 'dim2', 'dim3'])
        vi.mocked(useMetadataStore).mockReturnValue(
            createMetadataStoreStub({
                dimensions: Object.fromEntries(
                    ['dim1', 'dim2', 'dim3'].map((id) => [
                        id,
                        { id, dimensionType: 'DATA_ELEMENT' },
                    ])
                ) as Record<string, DimensionMetadataItem>,
            })
        )
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

describe('useOnDragEnd — dropping on the cell value axis', () => {
    const mockDispatch = vi.fn()
    const numericDimension = {
        id: 's1.de1',
        dimensionId: 'de1',
        name: 'Weight in kg',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
        aggregationType: 'SUM',
    } as unknown as DimensionMetadataItem
    const textDimension = {
        id: 's1.de2',
        dimensionId: 'de2',
        name: 'Comment',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'TEXT',
    } as unknown as DimensionMetadataItem

    const cellValueDropTarget = {
        data: { current: { isCellValueDroppable: true } },
    }
    const showAlert = vi.fn()
    const hideAlert = vi.fn()

    beforeEach(() => {
        vi.mocked(useAlert).mockReturnValue({
            show: showAlert,
            hide: hideAlert,
        })
        vi.mocked(useAppDispatch).mockReturnValue(mockDispatch)
        vi.mocked(useAppSelector).mockReturnValue([])
        vi.mocked(useMetadataStore).mockReturnValue(
            createMetadataStoreStub({
                dimensions: {
                    's1.de1': numericDimension,
                    's1.de2': textDimension,
                },
            })
        )
        mockDispatch.mockClear()
    })

    it('sets the cell value for a numeric dimension dragged from the sidebar', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const populateMetadata = vi.fn()

        result.current({
            active: {
                data: {
                    current: {
                        dimensionId: 's1.de1',
                        overlayItemProps: {},
                        populateMetadata,
                    },
                },
            },
            over: cellValueDropTarget,
        } as unknown as LayoutDragEndEvent)

        expect(populateMetadata).toHaveBeenCalled()
        expect(setVisUiConfigCellValue).toHaveBeenCalledWith({
            id: 's1.de1',
            aggregationType: 'SUM',
        })
        expect(showAlert).not.toHaveBeenCalled()
    })

    it('rejects a non-numeric dimension', () => {
        const { result } = renderHook(() => useOnDragEnd())

        result.current({
            active: {
                data: {
                    current: {
                        dimensionId: 's1.de2',
                        overlayItemProps: {},
                        populateMetadata: vi.fn(),
                    },
                },
            },
            over: cellValueDropTarget,
        } as unknown as LayoutDragEndEvent)

        expect(setVisUiConfigCellValue).not.toHaveBeenCalled()
        expect(showAlert).toHaveBeenCalled()
    })

    /* The alert is a warning, and `AlertBar` only auto-hides non-warnings, so
     * the hook has to dismiss it itself. */
    it('dismisses the rejection alert after five seconds', () => {
        vi.useFakeTimers()

        try {
            const { result } = renderHook(() => useOnDragEnd())

            result.current({
                active: {
                    data: {
                        current: {
                            dimensionId: 's1.de2',
                            overlayItemProps: {},
                            populateMetadata: vi.fn(),
                        },
                    },
                },
                over: cellValueDropTarget,
            } as unknown as LayoutDragEndEvent)

            expect(hideAlert).not.toHaveBeenCalled()

            vi.advanceTimersByTime(5000)

            expect(hideAlert).toHaveBeenCalled()
        } finally {
            vi.useRealTimers()
        }
    })

    /* The drop is a clone: without the guard this path falls through to the
     * "dropped outside the axes" branch, which removes the chip. */
    it('leaves a chip in its axis when it is dropped on the cell value axis', () => {
        const { result } = renderHook(() => useOnDragEnd())

        result.current({
            active: {
                data: {
                    current: {
                        dimensionId: 's1.de1',
                        axis: 'columns',
                        overlayItemProps: {},
                        insertAfter: false,
                        sortable: { index: 0 },
                    },
                },
            },
            over: cellValueDropTarget,
        } as unknown as LayoutDragEndEvent)

        expect(removeVisUiConfigLayoutDimensionFromAxis).not.toHaveBeenCalled()
        expect(moveVisUiConfigLayoutDimension).not.toHaveBeenCalled()
        expect(setVisUiConfigCellValue).toHaveBeenCalledWith({
            id: 's1.de1',
            aggregationType: 'SUM',
        })
    })
})
