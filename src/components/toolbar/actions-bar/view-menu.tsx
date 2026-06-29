import { SIDEBAR_DEFAULT_WIDTH } from '@components/sidebar/constants'
import {
    HoverMenuDropdown,
    HoverMenuList,
    HoverMenuListItem,
} from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getCurrentVisId } from '@store/current-vis-slice'
import {
    getUiSidebarWidth,
    resetUiSidebarWidth,
    getUiLayoutPanelExpanded,
    getUiLayoutPanelVisible,
    getUiSidebarVisible,
    getUiDetailsPanelVisible,
    resetUiLayoutPanelHeightCounter,
    toggleUiDetailsPanelVisible,
    toggleUiLayoutPanelVisible,
    toggleUiSidebarVisible,
} from '@store/ui-slice'
import { useCallback } from 'react'
import type { FC } from 'react'
import classes from './styles/actions-bar.module.css'

export const ViewMenu: FC = () => {
    const dispatch = useAppDispatch()

    const isSidebarVisible = useAppSelector(getUiSidebarVisible)
    const isLayoutPanelVisible = useAppSelector(getUiLayoutPanelVisible)
    const isLayoutPanelExpanded = useAppSelector(getUiLayoutPanelExpanded)
    const isDetailsPanelVisible = useAppSelector(getUiDetailsPanelVisible)
    const sidebarWidth = useAppSelector(getUiSidebarWidth)
    const id = useAppSelector(getCurrentVisId)

    const toggleLayoutPanelVisible = useCallback(() => {
        dispatch(toggleUiLayoutPanelVisible())
    }, [dispatch])

    const toggleSidebarVisible = useCallback(() => {
        dispatch(toggleUiSidebarVisible())
    }, [dispatch])

    const resetSidebarWidth = useCallback(() => {
        dispatch(resetUiSidebarWidth())
    }, [dispatch])

    const resizeLayoutToFit = useCallback(() => {
        dispatch(resetUiLayoutPanelHeightCounter())
    }, [dispatch])

    const toggleDetailsPanelVisible = useCallback(() => {
        dispatch(toggleUiDetailsPanelVisible())
    }, [dispatch])

    const toggleLayoutPanelText = isLayoutPanelVisible
        ? i18n.t('Hide layout')
        : i18n.t('Show layout')
    const toggleSidebarText = isSidebarVisible
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
                    label={i18n.t('Resize layout to fit')}
                    onClick={resizeLayoutToFit}
                    disabled={!isLayoutPanelVisible || !isLayoutPanelExpanded}
                />
                <HoverMenuListItem
                    label={toggleSidebarText}
                    onClick={toggleSidebarVisible}
                />
                <HoverMenuListItem
                    label={i18n.t('Reset dimensions sidebar width')}
                    onClick={resetSidebarWidth}
                    disabled={sidebarWidth === SIDEBAR_DEFAULT_WIDTH}
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
