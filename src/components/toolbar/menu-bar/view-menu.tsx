import i18n from '@dhis2/d2-i18n'
import type { FC } from 'react'
import { useCallback } from 'react'
import { ACCESSORY_PANEL_DEFAULT_WIDTH } from '@constants/panels'
import {
    HoverMenuDropdown,
    HoverMenuList,
    HoverMenuListItem,
} from '@dhis2/analytics'
import { useAppDispatch, useAppSelector } from '@hooks'
import { setUserSidebarWidthToLocalStorage } from '@modules/local-storage'
import { getCurrentVisId } from '@store/current-vis-slice'
import {
    getUiAccessoryPanelWidth,
    setUiAccessoryPanelWidth,
    getUiLayoutPanelVisible,
    getUiMainSidebarVisible,
    getUiDetailsPanelVisible,
    toggleUiLayoutPanelVisible,
    toggleUiMainSidebarVisible,
    setUiDetailsPanelVisible,
} from '@store/ui-slice'

export const ViewMenu: FC = () => {
    const dispatch = useAppDispatch()

    const isMainSidebarVisible = useAppSelector(getUiMainSidebarVisible)
    const isLayoutPanelVisible = useAppSelector(getUiLayoutPanelVisible)
    const isDetailsPanelVisible = useAppSelector(getUiDetailsPanelVisible)
    const userSettingWidth = useAppSelector(getUiAccessoryPanelWidth)
    const id = useAppSelector(getCurrentVisId)

    const toggleLayoutPanelVisible = useCallback(() => {
        dispatch(toggleUiLayoutPanelVisible())
    }, [dispatch])

    const toggleMainSidebarVisible = useCallback(() => {
        dispatch(toggleUiMainSidebarVisible())
    }, [dispatch])

    const resetAccessorySidebarWidth = useCallback(() => {
        setUserSidebarWidthToLocalStorage(ACCESSORY_PANEL_DEFAULT_WIDTH)
        dispatch(setUiAccessoryPanelWidth(ACCESSORY_PANEL_DEFAULT_WIDTH))
    }, [dispatch])

    const toggleDetailsPanelVisible = useCallback(() => {
        dispatch(setUiDetailsPanelVisible(!isDetailsPanelVisible))
    }, [dispatch, isDetailsPanelVisible])

    const toggleLayoutPanelText = isLayoutPanelVisible
        ? i18n.t('Hide layout')
        : i18n.t('Show layout')
    const toggleSidebarText = isMainSidebarVisible
        ? i18n.t('Hide dimensions sidebar')
        : i18n.t('Show dimensions sidebar')
    const toggleDetailsPanelText = isDetailsPanelVisible
        ? i18n.t('Hide interpretations and details')
        : i18n.t('Show interpretations and details')

    return (
        <HoverMenuDropdown label={i18n.t('View')}>
            <HoverMenuList>
                <HoverMenuListItem
                    label={toggleLayoutPanelText}
                    onClick={toggleLayoutPanelVisible}
                />
                <HoverMenuListItem
                    label={toggleSidebarText}
                    onClick={toggleMainSidebarVisible}
                />
                <HoverMenuListItem
                    label={i18n.t('Reset sidebar width')}
                    onClick={resetAccessorySidebarWidth}
                    disabled={
                        userSettingWidth === ACCESSORY_PANEL_DEFAULT_WIDTH
                    }
                />
                <HoverMenuListItem
                    label={toggleDetailsPanelText}
                    onClick={toggleDetailsPanelVisible}
                    disabled={!id}
                />
            </HoverMenuList>
        </HoverMenuDropdown>
    )
}
