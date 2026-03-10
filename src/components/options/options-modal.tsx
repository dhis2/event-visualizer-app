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
import { useCallback, useMemo, useState, type FC } from 'react'
import { OptionsTabContent } from './options-tab-content'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getOptionsTabsForVisType } from '@modules/options'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'
import type { OptionsTabKey } from 'src/types/options'

const FORM_ID = 'options-modal-form'

type OptionsModalProps = {
    onClose: () => void
}

export const OptionsModal: FC<OptionsModalProps> = ({ onClose }) => {
    const dispatch = useAppDispatch()

    const visType = useAppSelector(getVisUiConfigVisualizationType)

    const [activeTabKey, setActiveTabKey] = useState<OptionsTabKey>('data')

    const optionsTabs = useMemo(
        () => getOptionsTabsForVisType(visType),
        [visType]
    )

    const updateVisualizationAndClose = useCallback(() => {
        dispatch(tUpdateCurrentVisFromVisUiConfig())
        onClose()
    }, [onClose, dispatch])

    return (
        <Modal
            onClose={onClose}
            position="top"
            large
            dataTest={'options-modal'}
        >
            <ModalTitle>{i18n.t('Options')}</ModalTitle>
            <ModalContent dataTest={'options-modal-content'}>
                <TabBar dataTest={'options-modal-tab-bar'}>
                    {optionsTabs.map(({ key, label }) => (
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
                        onClick={onClose}
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
