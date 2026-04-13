import { IconPanelHide } from '@assets/icon-panel-hide'
import { IconPanelShow } from '@assets/icon-panel-show'
import { Toggler } from '@components/shared/toggler'
import i18n from '@dhis2/d2-i18n'
import { useAppSelector, useAppDispatch } from '@hooks'
import { getCurrentVisId } from '@store/current-vis-slice'
import {
    getUiDetailsPanelVisible,
    toggleUiDetailsPanelVisible,
} from '@store/ui-slice'
import { useCallback } from 'react'
import type { FC } from 'react'

export const InterpretationsAndDetailsToggler: FC = () => {
    const dispatch = useAppDispatch()

    const id = useAppSelector(getCurrentVisId)
    const isDetailsPanelVisible = useAppSelector(getUiDetailsPanelVisible)

    const onClick = useCallback(() => {
        dispatch(toggleUiDetailsPanelVisible())
    }, [dispatch])

    const tooltipText = isDetailsPanelVisible
        ? i18n.t('Hide details panel')
        : i18n.t('Show details panel')

    return (
        <Toggler
            dataTest="interpretations-and-details-toggler"
            disabled={!id}
            tooltipText={tooltipText}
            icon={isDetailsPanelVisible ? <IconPanelHide /> : <IconPanelShow />}
            onClick={onClick}
        />
    )
}
