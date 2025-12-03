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
import { useAppDispatch } from '@hooks'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import type { VisualizationType } from '@types'
import type { OptionsTab, OptionsTabKey } from 'src/types/options'

type OptionsModalProps = {
    activeTabKey: OptionsTabKey
    setActiveTabKey: (key: OptionsTabKey | null) => void
    tabs: OptionsTab[]
    visType: VisualizationType
}

const FORM_ID = 'options-modal-form'

export const OptionsModal: FC<OptionsModalProps> = ({
    activeTabKey,
    setActiveTabKey,
    tabs,
    visType,
}) => {
    const dispatch = useAppDispatch()
    const closeModal = useCallback(() => {
        setActiveTabKey(null)
    }, [setActiveTabKey])
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
                <form onSubmit={updateVisualizationAndClose} id={FORM_ID}>
                    <OptionsTabContent
                        tabKey={activeTabKey}
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
