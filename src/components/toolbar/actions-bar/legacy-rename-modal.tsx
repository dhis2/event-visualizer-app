import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui'
import type { FC } from 'react'

type LegacyRenameModalProps = {
    name: string
    onSaveAsNew: () => void
    onCancel: () => void
}

export const LegacyRenameModal: FC<LegacyRenameModalProps> = ({
    name,
    onSaveAsNew,
    onCancel,
}) => (
    <Modal onClose={onCancel} position="top" dataTest="legacy-rename-modal">
        <ModalTitle>{i18n.t('Save as a new visualization?')}</ModalTitle>
        <ModalContent>
            <p>
                {i18n.t(
                    'This visualization was made in an older app. Renaming it here would stop that app from editing it.'
                )}
            </p>
            <p>{i18n.t('Save a copy named "{{- name}}" instead?', { name })}</p>
        </ModalContent>
        <ModalActions>
            <ButtonStrip>
                <Button type="button" secondary onClick={onCancel}>
                    {i18n.t('Cancel')}
                </Button>
                <Button
                    type="button"
                    primary
                    onClick={onSaveAsNew}
                    dataTest="legacy-rename-modal-save-as-new"
                >
                    {i18n.t('Save as new')}
                </Button>
            </ButtonStrip>
        </ModalActions>
    </Modal>
)
