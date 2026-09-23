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
    clearVisUiConfigCellValue,
    getVisUiConfigCellValue,
} from '@store/vis-ui-config-slice'
import { type FC, useCallback, useState } from 'react'
import { CellValueItemPicker } from './cell-value-item-picker'
import classes from './styles/cell-value-modal.module.css'

type CellValueModalProps = {
    onClose: () => void
}

/* Which card is expanded is the modal's own business: the store only knows
 * whether a cell value is set, which is not yet true while the user is
 * picking one. */
type CellValueMode = 'COUNT' | 'DATA_ITEM'

export const CellValueModal: FC<CellValueModalProps> = ({ onClose }) => {
    const dispatch = useAppDispatch()
    const { programIds } = useLayoutContext()
    const cellValue = useAppSelector(getVisUiConfigCellValue)
    const [mode, setMode] = useState<CellValueMode>(
        cellValue ? 'DATA_ITEM' : 'COUNT'
    )

    const onSelectCount = useCallback(() => {
        setMode('COUNT')
        dispatch(clearVisUiConfigCellValue())
    }, [dispatch])
    const onSelectDataItem = useCallback(() => setMode('DATA_ITEM'), [])

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
                        value="DATA_ITEM"
                        label={i18n.t('Data item value')}
                        helpText={i18n.t(
                            "Each cell shows a data item's value instead — for example, a total or average. Used for every output type."
                        )}
                        selected={mode === 'DATA_ITEM'}
                        onSelect={onSelectDataItem}
                        dataTest="cell-value-mode-data-item"
                        emphasized
                    >
                        <CellValueItemPicker programId={programIds[0]} />
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
