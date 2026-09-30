import type {
    DndMonitorListener,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
} from '@dnd-kit/core'
import {
    dimensionSelectionSlice,
    initialState as dimensionSelectionInitialState,
} from '@store/dimensions-selection-slice'
import { renderWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { act, screen } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { DimensionDragOverlay } from '../dimension-drag-overlay'
import type { DraggedItemEventData } from '../types'

let dndListeners: DndMonitorListener | undefined

vi.mock('@dnd-kit/core', async () => {
    const actual = await vi.importActual('@dnd-kit/core')
    return {
        ...actual,
        useDndMonitor: vi.fn((listeners: DndMonitorListener) => {
            dndListeners = listeners
        }),
        /* The real DragOverlay renders its children only while dnd-kit has an
         * active drag, which needs a live DndContext driven by a pointer. */
        DragOverlay: function DragOverlayStub({ children }: PropsWithChildren) {
            return children
        },
    }
})

const setupTestStore = (multiSelectedDimensionIds: string[] = []) =>
    setupStore(
        { [dimensionSelectionSlice.name]: dimensionSelectionSlice.reducer },
        {
            dimensionSelection: {
                ...dimensionSelectionInitialState,
                multiSelectedDimensionIds,
            },
        }
    )

const overlayItemProps = {
    dimensionType: 'DATA_ELEMENT',
    dimensionName: 'Gender',
    itemsText: 'all',
    onClick: () => undefined,
}

const axisChipData = {
    dimensionId: 'Zj7UnCAulEk.oZg33kd9taw',
    axis: 'columns',
    insertAfter: false,
    isLayoutBlocked: false,
    sortable: { containerId: 'columns', index: 0, items: [] },
    overlayItemProps,
} as unknown as DraggedItemEventData

const sidebarItemData = (
    dimensionId = 'Zj7UnCAulEk.oZg33kd9taw'
): DraggedItemEventData =>
    ({
        dimensionId,
        isLayoutBlocked: false,
        populateMetadata: () => undefined,
        overlayItemProps,
    }) as unknown as DraggedItemEventData

const dragStart = (data: DraggedItemEventData) =>
    act(() =>
        dndListeners?.onDragStart?.({
            active: { data: { current: data } },
        } as unknown as DragStartEvent)
    )

const dragOver = (overData: object | null) =>
    act(() =>
        dndListeners?.onDragOver?.({
            over: overData ? { data: { current: overData } } : null,
        } as unknown as DragOverEvent)
    )

const dragEnd = () =>
    act(() => dndListeners?.onDragEnd?.({} as unknown as DragEndEvent))

const anAxisDropTarget = { axis: 'rows', isAxisContainer: true }

const queryRemoveIndicator = () => screen.queryByTestId('chip-remove-indicator')

describe('DimensionDragOverlay', () => {
    it('renders nothing until a drag starts', () => {
        renderWithReduxStoreProvider(<DimensionDragOverlay />, setupTestStore())

        expect(screen.queryByTestId('chip-items')).not.toBeInTheDocument()
    })

    it('does not offer to remove a layout chip at the start of a drag', () => {
        renderWithReduxStoreProvider(<DimensionDragOverlay />, setupTestStore())

        dragStart(axisChipData)

        expect(screen.getByText('Gender')).toBeInTheDocument()
        expect(queryRemoveIndicator()).not.toBeInTheDocument()
    })

    it('offers to remove a layout chip once the drag leaves every axis', () => {
        renderWithReduxStoreProvider(<DimensionDragOverlay />, setupTestStore())

        dragStart(axisChipData)
        dragOver(null)

        expect(queryRemoveIndicator()).toBeInTheDocument()
    })

    it('stops offering to remove when the drag returns to an axis', () => {
        renderWithReduxStoreProvider(<DimensionDragOverlay />, setupTestStore())

        dragStart(axisChipData)
        dragOver(null)
        dragOver(anAxisDropTarget)

        expect(queryRemoveIndicator()).not.toBeInTheDocument()
    })

    it('does not carry the removal state into the next drag', () => {
        renderWithReduxStoreProvider(<DimensionDragOverlay />, setupTestStore())

        dragStart(axisChipData)
        dragOver(null)
        dragEnd()
        dragStart(axisChipData)

        expect(queryRemoveIndicator()).not.toBeInTheDocument()
    })

    it('never offers to remove a sidebar dimension, wherever it is dragged', () => {
        renderWithReduxStoreProvider(<DimensionDragOverlay />, setupTestStore())

        dragStart(sidebarItemData())
        dragOver(null)

        expect(queryRemoveIndicator()).not.toBeInTheDocument()
    })

    it('counts the multi-selected dimensions when dragging one of them', () => {
        const multiSelectedIds = ['dimA', 'dimB', 'dimC']
        renderWithReduxStoreProvider(
            <DimensionDragOverlay />,
            setupTestStore(multiSelectedIds)
        )

        dragStart(sidebarItemData('dimB'))

        expect(screen.getByTestId('chip-multi-select-count')).toHaveTextContent(
            '3'
        )
    })

    it('shows no count when dragging a dimension outside the multi-selection', () => {
        renderWithReduxStoreProvider(
            <DimensionDragOverlay />,
            setupTestStore(['dimA', 'dimB'])
        )

        dragStart(sidebarItemData('dimC'))

        expect(
            screen.queryByTestId('chip-multi-select-count')
        ).not.toBeInTheDocument()
    })
})
