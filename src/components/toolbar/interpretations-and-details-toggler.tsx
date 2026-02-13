import i18n from '@dhis2/d2-i18n'
import type { FC } from 'react'
import { useCallback } from 'react'
import { Toggler } from './toggler'
import { IconPanelHide } from '@assets/icon-panel-hide'
import { IconPanelShow } from '@assets/icon-panel-show'
import { useAppSelector, useAppDispatch } from '@hooks'
import { getCurrentVisId } from '@store/current-vis-slice'
import {
    getUiDetailsPanelVisible,
    setUiDetailsPanelVisible,
} from '@store/ui-slice'

export const InterpretationsAndDetailsToggler: FC = () => {
    const dispatch = useAppDispatch()

    const id = useAppSelector(getCurrentVisId)
    const isDetailsPanelVisible = useAppSelector(getUiDetailsPanelVisible)

    const onClick = useCallback(() => {
        dispatch(setUiDetailsPanelVisible(!isDetailsPanelVisible))
    }, [dispatch, isDetailsPanelVisible])

    const tooltipText = isDetailsPanelVisible
        ? i18n.t('Hide details panel')
        : i18n.t('Show details panel')

    return (
        <Toggler
            disabled={!id}
            tooltipText={tooltipText}
            icon={isDetailsPanelVisible ? <IconPanelHide /> : <IconPanelShow />}
            onClick={onClick}
        />
    )
}
