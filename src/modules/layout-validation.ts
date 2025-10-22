import type { OutputType, EventVisualizationType } from '@types'

// Minimal local Layout type capturing fields used by this module.
type Layout = {
    type?: EventVisualizationType
    outputType?: OutputType
    program?: { id?: string } | null
    trackedEntityType?: { id?: string } | null
    legacy?: boolean
    [k: string]: unknown
}

export const layoutHasProgramId = (layout: Layout | undefined) =>
    Boolean(layout?.program?.id)

export const layoutHasTrackedEntityTypeId = (layout: Layout | undefined) =>
    Boolean(layout?.trackedEntityType?.id)

export const isLayoutValidForSave = (layout: Layout | undefined) =>
    layout?.outputType === 'TRACKED_ENTITY_INSTANCE'
        ? layoutHasTrackedEntityTypeId(layout)
        : layoutHasProgramId(layout) && !layout?.legacy

export const isLayoutValidForSaveAs = (layout: Layout | undefined) =>
    layout?.outputType === 'TRACKED_ENTITY_INSTANCE'
        ? layoutHasTrackedEntityTypeId(layout)
        : layoutHasProgramId(layout)
