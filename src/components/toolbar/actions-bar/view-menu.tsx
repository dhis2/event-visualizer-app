import { MAIN_SIDEBAR_DEFAULT_WIDTH } from '@components/main-sidebar/constants'
import {
    HoverMenuDropdown,
    HoverMenuList,
    HoverMenuListItem,
} from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getCurrentVisId } from '@store/current-vis-slice'
import {
    getUiMainSidebarWidth,
    resetUiMainSidebarWidth,
    getUiLayoutPanelVisible,
    getUiMainSidebarVisible,
    getUiDetailsPanelVisible,
    toggleUiLayoutPanelVisible,
    toggleUiMainSidebarVisible,
    setUiDetailsPanelVisible,
} from '@store/ui-slice'
import { useCallback } from 'react'
import type { FC } from 'react'
import classes from './styles/actions-bar.module.css'

export const ViewMenu: FC = () => {
    const dispatch = useAppDispatch()

    const isMainSidebarVisible = useAppSelector(getUiMainSidebarVisible)
    const isLayoutPanelVisible = useAppSelector(getUiLayoutPanelVisible)
    const isDetailsPanelVisible = useAppSelector(getUiDetailsPanelVisible)
    const mainSidebarWidth = useAppSelector(getUiMainSidebarWidth)
    const id = useAppSelector(getCurrentVisId)

    const toggleLayoutPanelVisible = useCallback(() => {
        dispatch(toggleUiLayoutPanelVisible())
    }, [dispatch])

    const toggleMainSidebarVisible = useCallback(() => {
        dispatch(toggleUiMainSidebarVisible())
    }, [dispatch])

    const resetMainSidebarWidth = useCallback(() => {
        dispatch(resetUiMainSidebarWidth())
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
        <HoverMenuDropdown
            label={i18n.t('View')}
            className={classes.menuDropdown}
        >
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
                    label={i18n.t('Reset dimension sidebar width')}
                    onClick={resetMainSidebarWidth}
                    disabled={mainSidebarWidth === MAIN_SIDEBAR_DEFAULT_WIDTH}
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
