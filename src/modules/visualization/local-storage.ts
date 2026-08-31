import { VISUALIZATION_TYPE_SET } from '@constants/visualization-types'
import {
    readLocalStorage,
    writeLocalStorage,
} from '@modules/utils/local-storage'
import type { VisualizationType } from '@types'

export const LAST_USED_TYPE_STORAGE_KEY = 'dhis2.event-visualizer.lastUsedType'

const isVisualizationType = (
    value: string | null
): value is VisualizationType =>
    value !== null && VISUALIZATION_TYPE_SET.has(value)

/* Undefined when nothing usable is stored, so the caller applies its own
 * default rather than this module duplicating it. */
export const getLastUsedVisualizationTypeFromLocalStorage = ():
    VisualizationType | undefined => {
    const stored = readLocalStorage(LAST_USED_TYPE_STORAGE_KEY)

    return isVisualizationType(stored) ? stored : undefined
}

export const setLastUsedVisualizationTypeToLocalStorage = (
    visualizationType: VisualizationType
): void => {
    writeLocalStorage(LAST_USED_TYPE_STORAGE_KEY, visualizationType)
}
