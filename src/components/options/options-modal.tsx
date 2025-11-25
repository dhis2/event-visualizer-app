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
import type { VisualizationType } from '@types'
import type { OptionsSection, OptionsSectionKey } from 'src/types/options'

type OptionsModalProps = {
    activeSection: OptionsSectionKey
    setActiveSection: (key: OptionsSectionKey | null) => void
    sections: OptionsSection[]
    visType: VisualizationType
}

export const OptionsModal: FC<OptionsModalProps> = ({
    activeSection,
    setActiveSection,
    sections,
    visType,
}) => {
    const closeModal = useCallback(() => {
        setActiveSection(null)
    }, [setActiveSection])
    const updateVisualizationAndClose = useCallback(() => {
        // TODO: dispatch an action here to to "reload the visualization from UI"
        closeModal()
    }, [closeModal])
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
                    {sections.map(({ id, displayName }) => (
                        <Tab
                            key={id}
                            onClick={() => setActiveSection(id)}
                            selected={id === activeSection}
                        >
                            {displayName}
                        </Tab>
                    ))}
                </TabBar>
                <OptionsSectionContent
                    sectionKey={activeSection}
                    visType={visType}
                />
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
                        onClick={updateVisualizationAndClose}
                        dataTest={'options-modal-action-confirm'}
                        type="button"
                        primary
                    >
                        {i18n.t('Update')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
