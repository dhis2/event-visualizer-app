import i18n from '@dhis2/d2-i18n'
import { IconFullscreen16, IconFullscreenExit16 } from '@dhis2/ui'
import { type FC, useCallback } from 'react'
import { Toggler } from './toggler'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    getUiShowExpandedVisualizationCanvas,
    toggleUiShowExpandedVisualizationCanvas,
} from '@store/ui-slice.js'

export const ExpandedVisualizationCanvasToggler: FC = () => {
    const dispatch = useAppDispatch()

    const isExpanded = useAppSelector(getUiShowExpandedVisualizationCanvas)

    const tooltipText = isExpanded
        ? i18n.t('Show panels')
        : i18n.t('Expand visualization and hide panels')

    const icon = isExpanded ? <IconFullscreenExit16 /> : <IconFullscreen16 />

    const onClick = useCallback(
        () => dispatch(toggleUiShowExpandedVisualizationCanvas()),
        [dispatch]
    )

    return <Toggler tooltipText={tooltipText} icon={icon} onClick={onClick} />
}
