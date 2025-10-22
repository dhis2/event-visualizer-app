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

const layoutHasProgramId = (layout: Layout) => Boolean(layout.program?.id)

const layoutHasTrackedEntityTypeId = (layout: Layout) =>
    Boolean(layout.trackedEntityType?.id)

export const isLayoutValidForSave = (layout: Layout) =>
    layout.outputType === 'TRACKED_ENTITY_INSTANCE'
        ? layoutHasTrackedEntityTypeId(layout)
        : layoutHasProgramId(layout) && !layout.legacy

export const isLayoutValidForSaveAs = (layout: Layout) =>
    layout.outputType === 'TRACKED_ENTITY_INSTANCE'
        ? layoutHasTrackedEntityTypeId(layout)
        : layoutHasProgramId(layout)
