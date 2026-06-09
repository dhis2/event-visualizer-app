import { visTypeDisplayNames } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui'
import type { VisualizationType } from '@types'
import type { FC } from 'react'

type ConversionConfirmationModalProps = {
    targetVisType: VisualizationType
    discardedDimensionNames: string[]
    onConfirm: () => void
    onCancel: () => void
}

export const ConversionConfirmationModal: FC<
    ConversionConfirmationModalProps
> = ({ targetVisType, discardedDimensionNames, onConfirm, onCancel }) => (
    <Modal
        onClose={onCancel}
        position="top"
        dataTest="conversion-confirmation-modal"
    >
        <ModalTitle>
            {i18n.t('Convert to {{- visType}}', {
                visType: visTypeDisplayNames[targetVisType],
            })}
        </ModalTitle>
        <ModalContent>
            <p>
                {i18n.t('{{- names}} will be removed. Are you sure?', {
                    names: discardedDimensionNames.join(', '),
                })}
            </p>
        </ModalContent>
        <ModalActions>
            <ButtonStrip>
                <Button type="button" secondary onClick={onCancel}>
                    {i18n.t('Cancel')}
                </Button>
                <Button type="button" primary onClick={onConfirm}>
                    {i18n.t('Convert')}
                </Button>
            </ButtonStrip>
        </ModalActions>
    </Modal>
)
