import { setLayoutPanelHeightToLocalStorage } from '@components/layout-panel/local-storage'
import { setSidebarWidthToLocalStorage } from '@components/sidebar/local-storage'
import { setLastUsedVisualizationTypeToLocalStorage } from '@modules/visualization/local-storage'
import { getPreloadedState } from '@store/store'
import { initialState as uiInitialState } from '@store/ui-slice'
import { initialState as visUiConfigInitialState } from '@store/vis-ui-config-slice'
import type { AppCachedData } from '@types'
import { describe, expect, it } from 'vitest'

const appCachedData = {
    systemSettings: { digitGroupSeparator: 'SPACE' },
} as AppCachedData

describe('getPreloadedState', () => {
    it('uses the stored preferences', () => {
        setLastUsedVisualizationTypeToLocalStorage('PIVOT_TABLE')
        setLayoutPanelHeightToLocalStorage(320)
        setSidebarWidthToLocalStorage(500)

        const { ui, visUiConfig } = getPreloadedState(appCachedData)

        expect(visUiConfig.visualizationType).toBe('PIVOT_TABLE')
        expect(ui.layoutPanelHeight).toBe(320)
        expect(ui.sidebarWidth).toBe(500)
    })

    it('falls back to the slice defaults when nothing was stored', () => {
        const { ui, visUiConfig } = getPreloadedState(appCachedData)

        expect(visUiConfig.visualizationType).toBe(
            visUiConfigInitialState.visualizationType
        )
        expect(ui.layoutPanelHeight).toBe(uiInitialState.layoutPanelHeight)
        expect(ui.sidebarWidth).toBe(uiInitialState.sidebarWidth)
    })
})
