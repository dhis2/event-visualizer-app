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
import { currentSlice } from '@store/current-slice'
import {
    uiSlice,
    toggleUiLayoutPanelHidden,
    toggleUiSidebarHidden,
    setUiAccessoryPanelWidth,
    setUiDetailsPanelOpen,
} from '@store/ui-slice'

export const ViewMenu: FC = () => {
    const dispatch = useAppDispatch()
    const {
        getUiAccessoryPanelWidth,
        getUiDetailsPanelOpen,
        getUiSidebarHidden,
        getUiLayoutPanelHidden,
    } = uiSlice.selectors
    const { getCurrentId } = currentSlice.selectors

    const isSidebarHidden = useAppSelector((state) => getUiSidebarHidden(state))
    const isLayoutPanelHidden = useAppSelector((state) =>
        getUiLayoutPanelHidden(state)
    )
    const isDetailsPanelOpen = useAppSelector((state) =>
        getUiDetailsPanelOpen(state)
    )
    const userSettingWidth = useAppSelector((state) =>
        getUiAccessoryPanelWidth(state)
    )
    const id = useAppSelector((state) => getCurrentId(state))

    const toggleLayoutPanelHidden = useCallback(() => {
        dispatch(toggleUiLayoutPanelHidden())
    }, [dispatch])

    const toggleSidebarHidden = useCallback(() => {
        dispatch(toggleUiSidebarHidden())
    }, [dispatch])

    const resetAccessorySidebarWidth = useCallback(() => {
        setUserSidebarWidthToLocalStorage(ACCESSORY_PANEL_DEFAULT_WIDTH)
        dispatch(setUiAccessoryPanelWidth(ACCESSORY_PANEL_DEFAULT_WIDTH))
    }, [dispatch])

    const toggleDetailsPanelOpen = useCallback(() => {
        dispatch(setUiDetailsPanelOpen(!isDetailsPanelOpen))
    }, [dispatch, isDetailsPanelOpen])

    const toggleLayoutPanelText = isLayoutPanelHidden
        ? i18n.t('Show layout')
        : i18n.t('Hide layout')
    const toggleSidebarText = isSidebarHidden
        ? i18n.t('Show dimensions sidebar')
        : i18n.t('Hide dimensions sidebar')
    const toggleDetailsPanelText = isDetailsPanelOpen
        ? i18n.t('Hide interpretations and details')
        : i18n.t('Show interpretations and details')

    return (
        <HoverMenuDropdown label={i18n.t('View')}>
            <HoverMenuList>
                <HoverMenuListItem
                    label={toggleLayoutPanelText}
                    onClick={toggleLayoutPanelHidden}
                />
                <HoverMenuListItem
                    label={toggleSidebarText}
                    onClick={toggleSidebarHidden}
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
                    onClick={toggleDetailsPanelOpen}
                    disabled={!id}
                />
            </HoverMenuList>
        </HoverMenuDropdown>
    )
}
