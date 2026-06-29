import type { SidebarSortableData } from '@components/app-wrapper/drag-and-drop-provider/types'
import i18n from '@dhis2/d2-i18n'
import type { DraggableSyntheticListeners } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    useAppSelector,
    useCrossTetMismatch,
    useMetadataStore,
    useTetId,
} from '@hooks'
import {
    getCrossTetMessage,
    getDimensionLayoutBlockedMessage,
} from '@modules/dimension'
import { resolveDimensionTetId } from '@modules/layout'
import {
    getMultiSelectedDimensionIds,
    isMultiSelecting,
} from '@store/dimensions-selection-slice'
import {
    getVisUiConfigCustomValue,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'
import { useMemo, type CSSProperties } from 'react'

type UseDimensionItemDndArgs = {
    dimension: DimensionMetadataItem
    populateMetadata: () => void
    disabled: boolean
    layoutBlockedMessage: string | null
}

type UseDimensionItemDndReturn = {
    setNodeRef: (node: HTMLElement | null) => void
    attributes: ReturnType<typeof useSortable>['attributes']
    listeners: DraggableSyntheticListeners
    isDragging: boolean
    style: CSSProperties | undefined
}

const getMultiSelectAllBlockedMessage = () =>
    i18n.t('None of the selected dimensions can be added to this layout.')

export const useDimensionItemDnd = ({
    dimension,
    populateMetadata,
    disabled,
    layoutBlockedMessage,
}: UseDimensionItemDndArgs): UseDimensionItemDndReturn => {
    const metadataStore = useMetadataStore()
    const multiSelecting = useAppSelector(isMultiSelecting)
    const multiSelectedIds = useAppSelector(getMultiSelectedDimensionIds)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const customValueId = customValue?.id ?? null
    const layoutTetId = useTetId()
    const crossTetMismatch = useCrossTetMismatch()
    const crossTetMessage = crossTetMismatch
        ? getCrossTetMessage(
              crossTetMismatch.dataSourceTetName,
              crossTetMismatch.layoutTetName
          )
        : ''

    const multiSelectBlocked = useMemo(() => {
        if (!multiSelecting || multiSelectedIds.length === 0) {
            return false
        }
        return multiSelectedIds.every((id) => {
            const dim = metadataStore.getMetadataItem(id) as
                | DimensionMetadataItem
                | undefined
            if (!dim) {
                return false
            }
            return (
                getDimensionLayoutBlockedMessage({
                    dimension: dim,
                    visualizationType,
                    customValueId,
                    layoutTetId,
                    dimensionTetId: resolveDimensionTetId(dim, metadataStore),
                    crossTetMessage,
                }) !== null
            )
        })
    }, [
        multiSelecting,
        multiSelectedIds,
        metadataStore,
        visualizationType,
        customValueId,
        layoutTetId,
        crossTetMessage,
    ])

    const resolvedIsLayoutBlocked = multiSelecting
        ? multiSelectBlocked
        : layoutBlockedMessage !== null

    const multiSelectBlockedMessage = multiSelectBlocked
        ? getMultiSelectAllBlockedMessage()
        : undefined

    const resolvedLayoutBlockedMessage = multiSelecting
        ? multiSelectBlockedMessage
        : (layoutBlockedMessage ?? undefined)

    const droppableData = useMemo<SidebarSortableData>(
        () => ({
            dimensionId: dimension.id,
            overlayItemProps: {
                dimensionType: dimension.dimensionType,
                dimensionName: dimension.name,
                itemsText: '',
                onClick: () => undefined,
            },
            populateMetadata,
            isLayoutBlocked: resolvedIsLayoutBlocked,
            layoutBlockedMessage: resolvedLayoutBlockedMessage,
        }),
        [
            dimension,
            populateMetadata,
            resolvedIsLayoutBlocked,
            resolvedLayoutBlockedMessage,
        ]
    )

    const {
        attributes,
        isDragging,
        isSorting,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        id: `sidebar-${dimension.id}`,
        disabled,
        data: droppableData,
    })

    const style = useMemo<CSSProperties | undefined>(
        () =>
            transform
                ? {
                      transform: isSorting
                          ? undefined
                          : CSS.Translate.toString({
                                x: transform.x,
                                y: transform.y,
                                scaleX: 1,
                                scaleY: 1,
                            }),
                      transition,
                  }
                : undefined,
        [transform, isSorting, transition]
    )

    return { setNodeRef, attributes, listeners, isDragging, style }
}
