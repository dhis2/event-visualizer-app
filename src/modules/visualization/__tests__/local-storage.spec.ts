import {
    getLastUsedVisualizationTypeFromLocalStorage,
    LAST_USED_TYPE_STORAGE_KEY,
    setLastUsedVisualizationTypeToLocalStorage,
} from '@modules/visualization/local-storage'
import { describe, expect, it } from 'vitest'

describe('last used visualization type', () => {
    it('returns undefined when nothing is stored', () => {
        expect(getLastUsedVisualizationTypeFromLocalStorage()).toBeUndefined()
    })

    it('returns undefined when the stored value is not a visualization type', () => {
        globalThis.localStorage.setItem(LAST_USED_TYPE_STORAGE_KEY, 'COLUMN')

        expect(getLastUsedVisualizationTypeFromLocalStorage()).toBeUndefined()
    })

    it('returns the stored visualization type', () => {
        setLastUsedVisualizationTypeToLocalStorage('PIVOT_TABLE')

        expect(getLastUsedVisualizationTypeFromLocalStorage()).toBe(
            'PIVOT_TABLE'
        )
    })

    it('overwrites a previously stored visualization type', () => {
        setLastUsedVisualizationTypeToLocalStorage('PIVOT_TABLE')
        setLastUsedVisualizationTypeToLocalStorage('LINE_LIST')

        expect(getLastUsedVisualizationTypeFromLocalStorage()).toBe('LINE_LIST')
    })
})
