import { describe, expect, it } from 'vitest'
import {
    getLayoutPanelHeightFromLocalStorage,
    setLayoutPanelHeightToLocalStorage,
} from '../local-storage'

describe('layout panel height local storage', () => {
    it('returns undefined when nothing is stored', () => {
        expect(getLayoutPanelHeightFromLocalStorage()).toBeUndefined()
    })

    it('returns the stored height', () => {
        setLayoutPanelHeightToLocalStorage(320)

        expect(getLayoutPanelHeightFromLocalStorage()).toBe(320)
    })

    it('clears the stored height when the panel is set to auto fit', () => {
        setLayoutPanelHeightToLocalStorage(320)
        setLayoutPanelHeightToLocalStorage('AUTO_FIT')

        expect(getLayoutPanelHeightFromLocalStorage()).toBeUndefined()
    })
})
