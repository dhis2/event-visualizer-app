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
    NoticeBox,
} from '@dhis2/ui'
import { useAppDispatch, useAppSelector, useMetadataItem } from '@hooks'
import { isProgramMetadataItem } from '@modules/metadata/item-guards'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import {
    clearVisUiConfigCellValue,
    getVisUiConfigCellValue,
    setVisUiConfigCellValue,
    type CellValueObject,
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
    const dataSourceId = useAppSelector(getDataSourceId)
    const dataSource = useMetadataItem(dataSourceId)
    const storedCellValue = useAppSelector(getVisUiConfigCellValue)
    const [mode, setMode] = useState<CellValueMode>(
        storedCellValue ? 'DATA_ITEM' : 'COUNT'
    )
    /* The pick is held here rather than in the store until the dialog closes,
     * so switching to Count and back keeps it while closing on Count discards
     * it. */
    const [draftCellValue, setDraftCellValue] = useState<
        CellValueObject | undefined
    >(storedCellValue)

    const onSelectCount = useCallback(() => setMode('COUNT'), [])
    const onSelectDataItem = useCallback(() => setMode('DATA_ITEM'), [])

    const commitAndClose = useCallback(() => {
        if (mode === 'DATA_ITEM' && draftCellValue) {
            dispatch(setVisUiConfigCellValue(draftCellValue))
        } else {
            dispatch(clearVisUiConfigCellValue())
        }
        onClose()
    }, [dispatch, mode, draftCellValue, onClose])

    /* Data items are offered for the program selected in the sidebar, which is
     * independent of the layout — a cell value from another program is a valid
     * pick that the output type buttons then flag. A tracked entity type data
     * source has no such list. */
    const dataSourceProgramId =
        dataSource && isProgramMetadataItem(dataSource)
            ? dataSource.id
            : undefined

    return (
        <Modal
            onClose={commitAndClose}
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
                            'Number of the events, enrollments or tracked entities.'
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
                            'An aggregated value for a data item.'
                        )}
                        selected={mode === 'DATA_ITEM'}
                        onSelect={onSelectDataItem}
                        dataTest="cell-value-mode-data-item"
                        emphasized
                    >
                        {dataSourceProgramId ? (
                            <CellValueItemPicker
                                programId={dataSourceProgramId}
                                cellValue={draftCellValue}
                                onChange={setDraftCellValue}
                            />
                        ) : (
                            <NoticeBox
                                dense
                                title={i18n.t('No program selected')}
                            >
                                {i18n.t(
                                    'Choose a program in the sidebar to pick a data item.'
                                )}
                            </NoticeBox>
                        )}
                    </RadioCard>
                </RadioCardGroup>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button
                        type="button"
                        onClick={commitAndClose}
                        dataTest="cell-value-modal-action-done"
                    >
                        {i18n.t('Done')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
