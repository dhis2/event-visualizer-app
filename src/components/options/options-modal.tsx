import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    Tab,
    TabBar,
} from '@dhis2/ui'
import { useCallback, type FC } from 'react'
import { OptionsSectionContent } from './options-section-content'
import { useAppDispatch } from '@hooks'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import type { VisualizationType } from '@types'
import type { OptionsSection, OptionsSectionKey } from 'src/types/options'

type OptionsModalProps = {
    activeSectionKey: OptionsSectionKey
    setActiveSectionKey: (key: OptionsSectionKey | null) => void
    sections: OptionsSection[]
    visType: VisualizationType
}

const FORM_ID = 'options-modal-form'

export const OptionsModal: FC<OptionsModalProps> = ({
    activeSectionKey,
    setActiveSectionKey,
    sections,
    visType,
}) => {
    const dispatch = useAppDispatch()
    const closeModal = useCallback(() => {
        setActiveSectionKey(null)
    }, [setActiveSectionKey])
    const updateVisualizationAndClose = useCallback(() => {
        dispatch(tUpdateCurrentVisFromVisUiConfig())
        closeModal()
    }, [closeModal, dispatch])
    return (
        <Modal
            onClose={closeModal}
            position="top"
            large
            dataTest={'options-modal'}
        >
            <ModalTitle>{i18n.t('Options')}</ModalTitle>
            <ModalContent dataTest={'options-modal-content'}>
                <TabBar dataTest={'options-modal-tab-bar'}>
                    {sections.map(({ key, label }) => (
                        <Tab
                            key={key}
                            onClick={() => setActiveSectionKey(key)}
                            selected={key === activeSectionKey}
                        >
                            {label}
                        </Tab>
                    ))}
                </TabBar>
                <form onSubmit={updateVisualizationAndClose} id={FORM_ID}>
                    <OptionsSectionContent
                        sectionKey={activeSectionKey}
                        visType={visType}
                    />
                </form>
            </ModalContent>
            <ModalActions dataTest={'options-modal-actions'}>
                <ButtonStrip>
                    <Button
                        type="button"
                        secondary
                        onClick={closeModal}
                        dataTest={'options-modal-action-cancel'}
                    >
                        {i18n.t('Hide')}
                    </Button>
                    <Button
                        dataTest={'options-modal-action-confirm'}
                        form={FORM_ID}
                        type="submit"
                        primary
                    >
                        {i18n.t('Update')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
