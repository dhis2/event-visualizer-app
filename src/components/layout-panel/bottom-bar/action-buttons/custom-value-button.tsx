import { CustomValueModal } from '@components/layout-panel/custom-value-modal'
import { aggregationTypeDisplayNames } from '@constants/aggregation-types'
import i18n from '@dhis2/d2-i18n'
import { IconSettings16, IconSync16, Tooltip } from '@dhis2/ui'
import {
    useAppDispatch,
    useAppSelector,
    useMetadataItem,
    useProgramStageIds,
} from '@hooks'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import {
    getVisUiConfigCustomValue,
    setVisUiConfigOutputType,
} from '@store/vis-ui-config-slice'
import cx from 'classnames'
import {
    useCallback,
    useMemo,
    useState,
    type FC,
    type ReactElement,
} from 'react'
import classes from './styles/action-buttons.module.css'
import { useActionButton } from './use-action-button'

const DEFAULT_TOOLTIP_OPEN_DELAY = 500

type WithTooltipProps = {
    content?: string
    openDelay?: number
    children: ReactElement
}

const WithTooltip: FC<WithTooltipProps> = ({
    content,
    openDelay = DEFAULT_TOOLTIP_OPEN_DELAY,
    children,
}) => {
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

export const CustomValueButton: FC = () => {
    const dispatch = useAppDispatch()
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const programStageIds = useProgramStageIds()
    const customValueMetadata = useMetadataItem(customValue?.id)
    const { action, tooltipConfig: actionTooltipConfig } = useActionButton(
        'EVENT',
        'CUSTOM_VALUE'
    )
    const [isModalOpen, setIsModalOpen] = useState(false)
    const isButtonReady = Boolean(
        customValue?.id && customValue?.aggregationType
    )
    const layoutStageId = programStageIds[0] ?? null
    const hasStageMismatch = Boolean(
        customValue?.id &&
        layoutStageId &&
        customValue.id.split('.')[0] !== layoutStageId
    )
    const isFullyDisabled = Boolean(actionTooltipConfig)
    const isUpdateDisabled = isFullyDisabled || hasStageMismatch
    const wrapperTooltipContent = (() => {
        if (actionTooltipConfig) {
            return actionTooltipConfig.content
        }
        if (customValue && !hasStageMismatch) {
            return i18n.t(
                'Using: {{- dataElementName}} ({{- aggregationType}})',
                {
                    dataElementName: customValueMetadata?.name,
                    aggregationType:
                        aggregationTypeDisplayNames[
                            customValue.aggregationType
                        ],
                    nsSeparator: '^^',
                }
            )
        }
        return undefined
    })()
    const updateButtonTooltipContent =
        !isFullyDisabled && hasStageMismatch
            ? i18n.t(
                  'Custom value is from a different stage than dimensions in the layout'
              )
            : undefined
    const configureButtonTooltipContent =
        !isFullyDisabled && hasStageMismatch
            ? i18n.t('Update custom value')
            : undefined
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

    const onUpdateClick = useCallback(() => {
        if (customValue) {
            dispatch(setVisUiConfigOutputType('EVENT'))
            dispatch(tUpdateCurrentVisFromVisUiConfig(true))
        } else {
            setIsModalOpen(true)
        }
    }, [customValue, dispatch])
    const onConfigureClick = useCallback(() => {
        setIsModalOpen((curr) => !curr)
    }, [])
    const onModalClose = useCallback(() => setIsModalOpen(false), [])

    return (
        <>
            <WithTooltip
                content={wrapperTooltipContent}
                openDelay={actionTooltipConfig?.openDelay}
            >
                <div className={classes.splitButton}>
                    <WithTooltip content={updateButtonTooltipContent}>
                        <button
                            type="button"
                            onClick={onUpdateClick}
                            disabled={isUpdateDisabled}
                            data-test="update-button-custom-value"
                            className={cx(classes.button, {
                                [classes.disabled]: isUpdateDisabled,
                                [classes.update]:
                                    action === 'update' && isButtonReady,
                                [classes.splitStart]: isButtonReady,
                            })}
                        >
                            {action === 'update' && <IconSync16 />}
                            {label}
                        </button>
                    </WithTooltip>

                    {isButtonReady && (
                        <WithTooltip content={configureButtonTooltipContent}>
                            <button
                                type="button"
                                onClick={onConfigureClick}
                                disabled={isFullyDisabled}
                                className={cx(
                                    classes.button,
                                    classes.splitEnd,
                                    {
                                        [classes.disabled]: isFullyDisabled,
                                        [classes.update]:
                                            action === 'update' &&
                                            !hasStageMismatch,
                                    }
                                )}
                            >
                                <IconSettings16 />
                            </button>
                        </WithTooltip>
                    )}
                </div>
            </WithTooltip>
            {isModalOpen && <CustomValueModal onClose={onModalClose} />}
        </>
    )
}
