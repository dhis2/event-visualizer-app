import { Tooltip } from '@dhis2/ui'
import { useAppDispatch } from '@hooks'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import {
    setVisUiConfigLastActiveButton,
    setVisUiConfigOutputType,
} from '@store/vis-ui-config-slice'
import type { LastActiveButton } from '@store/vis-ui-config-slice'
import type { OutputType } from '@types'
import cx from 'classnames'
import { type FC } from 'react'
import classes from './styles/action-buttons.module.css'
import { UpdateSyncIcon } from './update-sync-icon'
import { useActionSpin } from './use-action-spin'

export type ButtonAction = 'create' | 'switch' | 'update'

export type BaseButtonProps = {
    action: ButtonAction
    disabled?: boolean
    label: string
    lastActiveButton?: LastActiveButton
    tooltipProps?: object
    type: OutputType
}

const BaseButton: FC<BaseButtonProps> = ({
    action,
    disabled = false,
    label,
    lastActiveButton,
    tooltipProps,
    type,
}) => {
    const dispatch = useAppDispatch()
    const { syncIconRef, triggerSpin } = useActionSpin(action)

    const onClick = () => {
        triggerSpin()
        if (lastActiveButton !== undefined) {
            dispatch(setVisUiConfigLastActiveButton(lastActiveButton))
        }
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
            {action === 'update' && <UpdateSyncIcon ref={syncIconRef} />}
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
