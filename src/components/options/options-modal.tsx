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
import { OptionsTabContent } from './options-tab-content'
import type { VisualizationType } from '@types'
import type { OptionsTab, OptionsTabKey } from 'src/types/options'

type OptionsModalProps = {
    activeTabKey: OptionsTabKey
    setActiveTabKey: (key: OptionsTabKey | null) => void
    tabs: OptionsTab[]
    visType: VisualizationType
}

export const OptionsModal: FC<OptionsModalProps> = ({
    activeTabKey,
    setActiveTabKey,
    tabs,
    visType,
}) => {
    const closeModal = useCallback(() => {
        setActiveTabKey(null)
    }, [setActiveTabKey])
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
                    {tabs.map(({ key, label }) => (
                        <Tab
                            key={key}
                            onClick={() => setActiveTabKey(key)}
                            selected={key === activeTabKey}
                        >
                            {label}
                        </Tab>
                    ))}
                </TabBar>
                <OptionsTabContent tabKey={activeTabKey} visType={visType} />
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
