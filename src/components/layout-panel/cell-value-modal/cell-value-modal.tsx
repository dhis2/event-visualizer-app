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
} from '@dhis2/ui'
import { useAppDispatch, useAppSelector, useLayoutContext } from '@hooks'
import {
    clearVisUiConfigCustomValue,
    getVisUiConfigCustomValue,
} from '@store/vis-ui-config-slice'
import { type FC, useCallback, useState } from 'react'
import { CustomValueItemPicker } from './custom-value-item-picker'
import classes from './styles/cell-value-modal.module.css'

type CellValueModalProps = {
    onClose: () => void
}

/* Which card is expanded is the modal's own business: the store only knows
 * whether a custom value is set, which is not yet true while the user is
 * picking one. */
type CellValueMode = 'COUNT' | 'CUSTOM_VALUE'

export const CellValueModal: FC<CellValueModalProps> = ({ onClose }) => {
    const dispatch = useAppDispatch()
    const { programIds } = useLayoutContext()
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const [mode, setMode] = useState<CellValueMode>(
        customValue ? 'CUSTOM_VALUE' : 'COUNT'
    )

    const onSelectCount = useCallback(() => {
        setMode('COUNT')
        dispatch(clearVisUiConfigCustomValue())
    }, [dispatch])
    const onSelectCustomValue = useCallback(() => setMode('CUSTOM_VALUE'), [])

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
                        <CustomValueItemPicker programId={programIds[0]} />
                    </RadioCard>
                </RadioCardGroup>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button
                        type="button"
                        onClick={onClose}
                        dataTest="cell-value-modal-action-done"
                    >
                        {i18n.t('Done')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
