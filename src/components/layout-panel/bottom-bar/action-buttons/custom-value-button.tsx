import i18n from '@dhis2/d2-i18n'
import { IconSettings16, IconSync16, Tooltip } from '@dhis2/ui'
import cx from 'classnames'
import { useCallback, useMemo, useState, type FC } from 'react'
import classes from './styles/action-buttons.module.css'
import { useActionButton } from './use-action-button'
import { CustomValueModal } from '@components/layout-panel/bottom-bar/custom-value-modal'
import { aggregationTypeDisplayNames } from '@constants/aggregation-types'
import { useAppDispatch, useAppSelector, useMetadataItem } from '@hooks'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import {
    getVisUiConfigCustomValue,
    setVisUiConfigOutputType,
} from '@store/vis-ui-config-slice'
import { type OutputType } from '@types'

type ButtonAction = 'create' | 'switch' | 'update'

type BaseButtonProps = {
    action: ButtonAction
    disabled?: boolean
    label: string
    tooltipProps?: object
    type: OutputType
}

const BaseCustomValueButton: FC<BaseButtonProps> = ({
    action,
    disabled = false,
    label,
    tooltipProps,
    type,
}) => {
    const dispatch = useAppDispatch()
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const isButtonReady = useMemo(
        () =>
            Boolean(customValue?.dataElementId && customValue.aggregationType),
        [customValue]
    )

    const onClick = () => {
        if (customValue) {
            dispatch(setVisUiConfigOutputType(type))

            dispatch(tUpdateCurrentVisFromVisUiConfig())
        } else {
            setIsModalOpen(true)
        }
    }

    const onCogwheelClick = () => setIsModalOpen((curr) => !curr)
    const onModalClose = useCallback(() => setIsModalOpen(false), [])

    return (
        <div className={classes.splitButton}>
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                className={cx(classes.button, {
                    [classes.disabled]: disabled,
                    [classes.update]: action === 'update' && isButtonReady,
                    [classes.splitLeft]: isButtonReady,
                })}
                {...tooltipProps}
            >
                {action === 'update' && <IconSync16 />}
                {label}
            </button>
            {isButtonReady && (
                <button
                    onClick={onCogwheelClick}
                    className={cx(classes.button, classes.splitRight, {
                        [classes.disabled]: disabled,
                        [classes.update]: action === 'update' && isButtonReady,
                    })}
                    {...tooltipProps}
                >
                    <IconSettings16 />
                </button>
            )}

            {isModalOpen && <CustomValueModal onClose={onModalClose} />}
        </div>
    )
}

export const CustomValueButton: FC = () => {
    const customValue = useAppSelector(getVisUiConfigCustomValue)

    const customValueMetadata = useMetadataItem(customValue?.dataElementId)

    const { action } = useActionButton('EVENT')

    const label = useMemo(() => {
        switch (action) {
            case 'create':
                return i18n.t('Create custom value table')
            case 'switch':
                return i18n.t('Switch to custom value table')
            case 'update':
                return i18n.t('Update custom value table')
        }
    }, [action])

    const buttonProps = useMemo(
        (): BaseButtonProps => ({
            action,
            label,
            type: 'EVENT',
        }),
        [action, label]
    )

    if (customValue) {
        const tooltipContent = i18n.t(
            `Using: {{dataElementName}} ({{aggregationType}})`,
            {
                dataElementName: customValueMetadata?.name,
                aggregationType:
                    aggregationTypeDisplayNames[customValue.aggregationType],
                nsSeparator: '^^',
            }
        )

        return (
            <Tooltip content={tooltipContent} openDelay={500}>
                {(tooltipProps) => (
                    <BaseCustomValueButton
                        {...buttonProps}
                        tooltipProps={tooltipProps}
                    />
                )}
            </Tooltip>
        )
    }

    return <BaseCustomValueButton {...buttonProps} />
}
