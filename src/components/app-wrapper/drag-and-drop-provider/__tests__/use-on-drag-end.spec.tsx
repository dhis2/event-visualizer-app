import { useAlert } from '@dhis2/app-runtime'
import {
    useAppDispatch,
    useAppSelector,
    useAddMetadata,
    useMetadataStore,
} from '@hooks'
import { clearMultiSelection } from '@store/dimensions-selection-slice'
import { tSetCustomValue } from '@store/thunks'
import {
    addVisUiConfigLayoutDimension,
    addVisUiConfigLayoutDimensions,
    clearVisUiConfigCustomValue,
    moveVisUiConfigCustomValueToAxis,
    moveVisUiConfigLayoutDimension,
    removeVisUiConfigLayoutDimensionFromAxis,
} from '@store/vis-ui-config-slice'
import { createMetadataStoreStub } from '@test-utils/metadata-store-stub'
import { renderHook } from '@testing-library/react'
import type { DimensionMetadataItem } from '@types'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { LayoutDragEndEvent } from '../types'
import { useOnDragEnd } from '../use-on-drag-end'

const { mockShowAlert, mockHideAlert } = vi.hoisted(() => ({
    mockShowAlert: vi.fn(),
    mockHideAlert: vi.fn(),
}))

vi.mock('@dhis2/app-runtime', () => ({
    useAlert: vi.fn(() => ({ show: mockShowAlert, hide: mockHideAlert })),
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
    moveVisUiConfigCustomValueToAxis: vi.fn(),
    clearVisUiConfigCustomValue: vi.fn(),
    getVisUiConfigVisualizationType: vi.fn(),
    getVisUiConfigCustomValue: vi.fn(),
    getVisUiConfigLayoutAllDimensionIds: vi.fn(() => []),
}))

vi.mock('@store/thunks', () => ({
    tSetCustomValue: vi.fn(),
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

    it('sets the dropped sidebar dimension as the custom value', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const populateMetadata = vi.fn()
        const event = {
            active: {
                data: {
                    current: {
                        dimensionId: 'stage1.numericDe',
                        overlayItemProps: {},
                        populateMetadata,
                        isLayoutBlocked: false,
                        canBeCustomValue: true,
                    },
                },
            },
            over: { data: { current: { isValueContainer: true } } },
        } as unknown as LayoutDragEndEvent

        result.current(event)

        expect(populateMetadata).toHaveBeenCalled()
        expect(tSetCustomValue).toHaveBeenCalledWith('stage1.numericDe')
        expect(mockDispatch).toHaveBeenCalledWith(clearMultiSelection())
    })

    it('sets a dropped chip as the custom value without removing it itself', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const event = {
            active: {
                data: {
                    current: {
                        dimensionId: 'stage1.numericDe',
                        axis: 'rows',
                        sortable: { index: 1 },
                        overlayItemProps: {},
                        insertAfter: false,
                        isLayoutBlocked: false,
                        canBeCustomValue: true,
                    },
                },
            },
            over: { data: { current: { isValueContainer: true } } },
        } as unknown as LayoutDragEndEvent

        result.current(event)

        /* Setting the custom value takes it out of the layout. */
        expect(removeVisUiConfigLayoutDimensionFromAxis).not.toHaveBeenCalled()
        expect(tSetCustomValue).toHaveBeenCalledWith('stage1.numericDe')
    })

    describe('dragging the value chip', () => {
        const valueChipData = {
            dimensionId: 'stage1.numericDe',
            overlayItemProps: {},
            isValueChip: true,
            isLayoutBlocked: false,
            canBeCustomValue: true,
        }

        it('moves it to the axis it is dropped on', () => {
            const { result } = renderHook(() => useOnDragEnd())
            const event = {
                active: { data: { current: valueChipData } },
                over: {
                    data: {
                        current: {
                            dimensionId: 'ou',
                            axis: 'rows',
                            sortable: { index: 2 },
                            insertAfter: true,
                        },
                    },
                },
            } as unknown as LayoutDragEndEvent

            result.current(event)

            expect(moveVisUiConfigCustomValueToAxis).toHaveBeenCalledWith({
                axis: 'rows',
                insertIndex: 2,
                insertAfter: true,
            })
        })

        it('moves it to the start of an empty axis', () => {
            const { result } = renderHook(() => useOnDragEnd())
            const event = {
                active: { data: { current: valueChipData } },
                over: {
                    data: {
                        current: { axis: 'filters', isAxisContainer: true },
                    },
                },
            } as unknown as LayoutDragEndEvent

            result.current(event)

            expect(moveVisUiConfigCustomValueToAxis).toHaveBeenCalledWith({
                axis: 'filters',
                insertIndex: 0,
                insertAfter: false,
            })
        })

        it('resets to count when dropped outside the layout', () => {
            const { result } = renderHook(() => useOnDragEnd())
            const event = {
                active: { data: { current: valueChipData } },
                over: null,
            } as unknown as LayoutDragEndEvent

            result.current(event)

            expect(clearVisUiConfigCustomValue).toHaveBeenCalled()
            expect(moveVisUiConfigCustomValueToAxis).not.toHaveBeenCalled()
        })

        it('does nothing when dropped back on the value axis', () => {
            const { result } = renderHook(() => useOnDragEnd())
            const event = {
                active: { data: { current: valueChipData } },
                over: { data: { current: { isValueContainer: true } } },
            } as unknown as LayoutDragEndEvent

            result.current(event)

            expect(mockDispatch).not.toHaveBeenCalled()
        })
    })

    it('keeps a chip in its axis when it cannot be the custom value', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const event = {
            active: {
                data: {
                    current: {
                        dimensionId: 'stage1.textDe',
                        axis: 'rows',
                        sortable: { index: 1 },
                        overlayItemProps: {},
                        insertAfter: false,
                        isLayoutBlocked: false,
                        canBeCustomValue: false,
                    },
                },
            },
            over: { data: { current: { isValueContainer: true } } },
        } as unknown as LayoutDragEndEvent

        result.current(event)

        expect(mockDispatch).not.toHaveBeenCalled()
    })

    describe('refusing a non-numeric cell value', () => {
        const NOT_NUMERIC_MESSAGE =
            'Only numeric data items can be used as the cell value, because the value is aggregated.'
        const textDimensionEvent = {
            active: {
                data: {
                    current: {
                        dimensionId: 'stage1.textDe',
                        overlayItemProps: {},
                        populateMetadata: vi.fn(),
                        isLayoutBlocked: false,
                        canBeCustomValue: false,
                    },
                },
            },
            over: { data: { current: { isValueContainer: true } } },
        } as unknown as LayoutDragEndEvent

        beforeEach(() => {
            vi.useFakeTimers()
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('warns with an alert that hides itself after five seconds', () => {
            const { result } = renderHook(() => useOnDragEnd())

            result.current(textDimensionEvent)

            expect(useAlert).toHaveBeenCalledWith(NOT_NUMERIC_MESSAGE, {
                warning: true,
            })
            expect(mockShowAlert).toHaveBeenCalledTimes(1)

            vi.advanceTimersByTime(4999)
            expect(mockHideAlert).not.toHaveBeenCalled()

            vi.advanceTimersByTime(1)
            expect(mockHideAlert).toHaveBeenCalledTimes(1)
        })

        it('restarts the five seconds when refused again', () => {
            const { result } = renderHook(() => useOnDragEnd())

            result.current(textDimensionEvent)
            vi.advanceTimersByTime(3000)
            result.current(textDimensionEvent)
            vi.advanceTimersByTime(3000)

            expect(mockHideAlert).not.toHaveBeenCalled()

            vi.advanceTimersByTime(2000)
            expect(mockHideAlert).toHaveBeenCalledTimes(1)
        })
    })
})
