import { describe, expect, it } from 'vitest'
import {
    AXES_HEIGHT_STORAGE_KEY,
    getLayoutPanelHeightFromLocalStorage,
    setLayoutPanelHeightToLocalStorage,
} from '../local-storage'

describe('layout panel height local storage', () => {
    it('reports auto fit when nothing is stored', () => {
        expect(getLayoutPanelHeightFromLocalStorage()).toBe('AUTO_FIT')
    })

    it('reports auto fit when the stored value is not a number', () => {
        globalThis.localStorage.setItem(AXES_HEIGHT_STORAGE_KEY, 'tall')

        expect(getLayoutPanelHeightFromLocalStorage()).toBe('AUTO_FIT')
    })

    it('returns the stored height', () => {
        setLayoutPanelHeightToLocalStorage(320)

        expect(getLayoutPanelHeightFromLocalStorage()).toBe(320)
    })

    it('reports auto fit again once the panel is set back to auto fit', () => {
        setLayoutPanelHeightToLocalStorage(320)
        setLayoutPanelHeightToLocalStorage('AUTO_FIT')

        expect(getLayoutPanelHeightFromLocalStorage()).toBe('AUTO_FIT')
    })
})
