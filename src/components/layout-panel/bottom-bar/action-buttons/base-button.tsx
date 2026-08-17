import { Tooltip } from '@dhis2/ui'
import { useAppDispatch } from '@hooks'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import { setVisUiConfigOutputType } from '@store/vis-ui-config-slice'
import type { OutputType } from '@types'
import cx from 'classnames'
import { type FC, type ReactElement } from 'react'
import classes from './styles/action-buttons.module.css'
import { UpdateSyncIcon } from './update-sync-icon'
import { useUpdateAnimation } from './use-update-animation'

export type ButtonAction = 'create' | 'switch' | 'update'

const DEFAULT_TOOLTIP_OPEN_DELAY = 500

export type BaseButtonProps = {
    action: ButtonAction
    dataTest?: string
    disabled?: boolean
    label: string
    tooltipProps?: object
    type: OutputType
    valueFooter?: ValueFooterConfig
}

/* The cell value segment to the right of an active button. Present only when
 * the output type's cells hold an aggregate the user can change. */
export type ValueFooterConfig = {
    label: string
    onClick: () => void
    tooltipContent?: string
}

/* Disabled `<button>` elements don't emit pointer events in some browsers, so
 * the tooltip's handlers have to attach to a wrapper around the button. */
const WithTooltip: FC<{
    content?: string
    openDelay?: number
    children: ReactElement
}> = ({ content, openDelay = DEFAULT_TOOLTIP_OPEN_DELAY, children }) => {
    if (!content) {
        return children
    }

    return (
        <Tooltip content={content} openDelay={openDelay}>
            {(tooltipProps: object) => (
                <span className={classes.tooltipWrapper} {...tooltipProps}>
                    {children}
                </span>
            )}
        </Tooltip>
    )
}

const BaseButton: FC<BaseButtonProps> = ({
    action,
    dataTest,
    disabled = false,
    label,
    tooltipProps,
    type,
    valueFooter,
}) => {
    const dispatch = useAppDispatch()
    const { isAnimating } = useUpdateAnimation(type)

    const onClick = () => {
        dispatch(setVisUiConfigOutputType(type))
        dispatch(tUpdateCurrentVisFromVisUiConfig())
    }

    const mainButton = (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            data-test={dataTest}
            className={cx(classes.button, {
                [classes.update]: action === 'update',
                [classes.splitStart]: Boolean(valueFooter),
            })}
            {...(valueFooter ? {} : tooltipProps)}
        >
            {action === 'update' && (
                <UpdateSyncIcon isAnimating={isAnimating} />
            )}
            {label}
        </button>
    )

    if (!valueFooter) {
        return mainButton
    }

    return (
        <div className={classes.splitButton} {...tooltipProps}>
            {mainButton}
            <WithTooltip content={valueFooter.tooltipContent}>
                <button
                    type="button"
                    onClick={valueFooter.onClick}
                    disabled={disabled}
                    data-test={dataTest && `${dataTest}-value-footer`}
                    className={cx(
                        classes.button,
                        classes.update,
                        classes.splitEnd
                    )}
                >
                    <span className={classes.valueLabel}>
                        {valueFooter.label}
                    </span>
                </button>
            </WithTooltip>
        </div>
    )
}

export const BaseButtonWithConditionalTooltip: FC<
    BaseButtonProps & {
        tooltipConfig?: { content: string; openDelay?: number }
    }
> = ({ tooltipConfig, ...props }) => {
    if (tooltipConfig) {
        const { content, openDelay = DEFAULT_TOOLTIP_OPEN_DELAY } =
            tooltipConfig

        return (
            <Tooltip content={content} openDelay={openDelay}>
                {(tooltipProps) => (
                    <BaseButton {...props} tooltipProps={tooltipProps} />
                )}
            </Tooltip>
        )
    }

    return <BaseButton {...props} />
}
