import { Tooltip } from '@dhis2/ui'
import { useAppDispatch } from '@hooks'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import { setVisUiConfigOutputType } from '@store/vis-ui-config-slice'
import type { OutputType } from '@types'
import cx from 'classnames'
import { type FC } from 'react'
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
}

const BaseButton: FC<BaseButtonProps> = ({
    action,
    dataTest,
    disabled = false,
    label,
    tooltipProps,
    type,
}) => {
    const dispatch = useAppDispatch()
    const { isAnimating } = useUpdateAnimation(type)

    const onClick = () => {
        dispatch(setVisUiConfigOutputType(type))
        dispatch(tUpdateCurrentVisFromVisUiConfig())
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            data-test={dataTest}
            className={cx(classes.button, {
                [classes.update]: action === 'update',
            })}
            {...tooltipProps}
        >
            {action === 'update' && (
                <UpdateSyncIcon isAnimating={isAnimating} />
            )}
            {label}
        </button>
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
