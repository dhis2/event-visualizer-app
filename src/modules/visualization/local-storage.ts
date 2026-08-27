import { VISUALIZATION_TYPES } from '@constants/visualization-types'
import type { VisualizationType } from '@types'

export const LAST_USED_TYPE_STORAGE_KEY = 'dhis2.event-visualizer.lastUsedType'

const isVisualizationType = (
    value: string | null
): value is VisualizationType =>
    VISUALIZATION_TYPES.some((visType) => visType === value)

/* Undefined when nothing usable is stored, so the caller applies its own
 * default rather than this module duplicating it. */
export const getLastUsedVisualizationTypeFromLocalStorage = ():
    VisualizationType | undefined => {
    try {
        const stored = globalThis.localStorage.getItem(
            LAST_USED_TYPE_STORAGE_KEY
        )

        return isVisualizationType(stored) ? stored : undefined
    } catch {
        return undefined
    }
}

export const setLastUsedVisualizationTypeToLocalStorage = (
    visualizationType: VisualizationType
): void => {
    try {
        globalThis.localStorage.setItem(
            LAST_USED_TYPE_STORAGE_KEY,
            visualizationType
        )
    } catch {
        // ignore
    }
}
