import { IconSync16, Tooltip } from '@dhis2/ui'
import cx from 'classnames'
import { type FC } from 'react'
import classes from './styles/action-buttons.module.css'
import { useAppDispatch } from '@hooks'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import { setVisUiConfigOutputType } from '@store/vis-ui-config-slice'
import type { OutputType } from '@types'

export type ButtonAction = 'create' | 'switch' | 'update'

type BaseButtonProps = {
    action: ButtonAction
    disabled?: boolean
    label: string
    tooltipProps?: object
    type: OutputType
}

const BaseButton: FC<BaseButtonProps> = ({
    action,
    disabled = false,
    label,
    tooltipProps,
    type,
}) => {
    const dispatch = useAppDispatch()

    const onClick = () => {
        dispatch(setVisUiConfigOutputType(type))

        dispatch(tUpdateCurrentVisFromVisUiConfig())
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cx(classes.button, {
                [classes.disabled]: disabled,
                [classes.update]: action === 'update',
            })}
            {...tooltipProps}
        >
            {action === 'update' && <IconSync16 />}
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
        const { content, openDelay = 500 } = tooltipConfig

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
