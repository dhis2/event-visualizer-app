import i18n from '@dhis2/d2-i18n'
import {
    Button,
    IconFullscreen16,
    IconFullscreenExit16,
    Tooltip,
} from '@dhis2/ui'
import { type FC, useCallback } from 'react'
import classes from './styles/expanded-visualization-canvas-toggle.module.css'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    getUiShowExpandedVisualizationCanvas,
    toggleUiShowExpandedVisualizationCanvas,
} from '@store/ui-slice.js'

export const ExpandedVisualizationCanvasToggle: FC = () => {
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

    return (
        <Tooltip
            dataTest="fullscreen-toggle-tooltip"
            content={tooltipText}
            closeDelay={0}
        >
            {({ onMouseOver, onMouseOut, ref }) => (
                <span
                    onMouseOver={onMouseOver}
                    onMouseOut={onMouseOut}
                    ref={ref}
                    className={classes.tooltipAnchor}
                >
                    <Button
                        icon={icon}
                        small
                        onClick={onClick}
                        dataTest="fullscreen-toggler"
                    />
                </span>
            )}
        </Tooltip>
    )
}
