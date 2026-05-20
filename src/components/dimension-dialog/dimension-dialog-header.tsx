import i18n from '@dhis2/d2-i18n'
import {
    IconCross16,
    IconFullscreen16,
    IconFullscreenExit16,
    IconInfo16,
    Tooltip,
} from '@dhis2/ui'
import type { DimensionDialogMode } from '@store/ui-slice'
import type { FC } from 'react'
import classes from './styles/dimension-dialog.module.css'

type DimensionDialogHeaderProps = {
    title: string
    info?: string
    mode: DimensionDialogMode
    onToggleMode: () => void
    onClose: () => void
    dataTest?: string
}

export const DimensionDialogHeader: FC<DimensionDialogHeaderProps> = ({
    title,
    info,
    mode,
    onToggleMode,
    onClose,
    dataTest = 'dimension-dialog-header',
}) => {
    const toggleTooltip =
        mode === 'modal'
            ? i18n.t('Switch to popover mode')
            : i18n.t('Switch to modal mode')
    const ToggleIcon =
        mode === 'modal' ? IconFullscreenExit16 : IconFullscreen16

    return (
        <div className={classes.header} data-test={dataTest}>
            <div className={classes.titleWrapper}>
                <div className={classes.title} data-test={`${dataTest}-title`}>
                    {title}
                </div>
                {info && (
                    <Tooltip content={info} placement="bottom" maxWidth={320}>
                        <span
                            tabIndex={0}
                            role="img"
                            aria-label={i18n.t('About this dimension')}
                            className={classes.infoIcon}
                            data-test={`${dataTest}-info`}
                        >
                            <IconInfo16 />
                        </span>
                    </Tooltip>
                )}
            </div>
            <div className={classes.headerActions}>
                <Tooltip content={toggleTooltip} placement="bottom">
                    <button
                        type="button"
                        className={classes.headerIconButton}
                        onClick={onToggleMode}
                        aria-label={toggleTooltip}
                        data-test={`${dataTest}-toggle-mode`}
                    >
                        <ToggleIcon />
                    </button>
                </Tooltip>
                <Tooltip content={i18n.t('Close')} placement="bottom">
                    <button
                        type="button"
                        className={classes.headerIconButton}
                        onClick={onClose}
                        aria-label={i18n.t('Close')}
                        data-test={`${dataTest}-close`}
                    >
                        <IconCross16 />
                    </button>
                </Tooltip>
            </div>
        </div>
    )
}
