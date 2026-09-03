import {
    RadioCard,
    RadioCardGroup,
} from '@components/shared/radio-card/radio-card'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    Tooltip,
} from '@dhis2/ui'
import { useAppDispatch, useAppSelector, useLayoutContext } from '@hooks'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import {
    clearVisUiConfigCustomValue,
    getVisUiConfigCustomValue,
    setVisUiConfigCustomValue,
    type CustomValueObject,
} from '@store/vis-ui-config-slice'
import { type FC, useCallback, useState } from 'react'
import { CustomValueItemPicker } from './custom-value-item-picker'
import classes from './styles/cell-value-modal.module.css'

type CellValueModalProps = {
    onClose: () => void
}

type CellValueMode = 'COUNT' | 'CUSTOM_VALUE'

export const CellValueModal: FC<CellValueModalProps> = ({ onClose }) => {
    const dispatch = useAppDispatch()
    const { programIds } = useLayoutContext()
    const storedCustomValue = useAppSelector(getVisUiConfigCustomValue)
    const [mode, setMode] = useState<CellValueMode>(
        storedCustomValue ? 'CUSTOM_VALUE' : 'COUNT'
    )
    const [customValue, setCustomValue] = useState<
        CustomValueObject | undefined
    >(storedCustomValue)

    const onSelectCount = useCallback(() => setMode('COUNT'), [])
    const onSelectCustomValue = useCallback(() => setMode('CUSTOM_VALUE'), [])

    const onUpdate = useCallback(() => {
        if (mode === 'COUNT') {
            dispatch(clearVisUiConfigCustomValue())
        } else if (customValue) {
            dispatch(setVisUiConfigCustomValue(customValue))
        }
        dispatch(tUpdateCurrentVisFromVisUiConfig())
        onClose()
    }, [customValue, dispatch, mode, onClose])

    const isUpdateDisabled = mode === 'CUSTOM_VALUE' && !customValue

    return (
        <Modal
            onClose={onClose}
            position="top"
            large
            dataTest="cell-value-modal"
        >
            <ModalTitle>{i18n.t('Cell value')}</ModalTitle>
            <ModalContent className={classes.content}>
                <RadioCardGroup legend={i18n.t('Cell value')} hideLegend>
                    <RadioCard
                        name="cell-value-mode"
                        value="COUNT"
                        label={i18n.t('Count')}
                        helpText={i18n.t(
                            'Each cell shows a count of the events, enrollments or tracked entities the table is built from.'
                        )}
                        selected={mode === 'COUNT'}
                        onSelect={onSelectCount}
                        dataTest="cell-value-mode-count"
                        emphasized
                    />
                    <RadioCard
                        name="cell-value-mode"
                        value="CUSTOM_VALUE"
                        label={i18n.t('Custom value')}
                        helpText={i18n.t(
                            "Each cell shows a data item's value instead — for example, a total or average. Used for every output type."
                        )}
                        selected={mode === 'CUSTOM_VALUE'}
                        onSelect={onSelectCustomValue}
                        dataTest="cell-value-mode-custom-value"
                        emphasized
                    >
                        <CustomValueItemPicker
                            programId={programIds[0]}
                            initialCustomValue={storedCustomValue}
                            onChange={setCustomValue}
                        />
                    </RadioCard>
                </RadioCardGroup>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button type="button" secondary onClick={onClose}>
                        {i18n.t('Cancel')}
                    </Button>
                    {isUpdateDisabled ? (
                        <Tooltip
                            content={i18n.t('Select a value before updating')}
                        >
                            {(tooltipProps: object) => (
                                <span {...tooltipProps}>
                                    <Button type="button" primary disabled>
                                        {i18n.t('Update')}
                                    </Button>
                                </span>
                            )}
                        </Tooltip>
                    ) : (
                        <Button type="button" primary onClick={onUpdate}>
                            {i18n.t('Update')}
                        </Button>
                    )}
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
