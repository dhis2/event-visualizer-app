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
import { useAppSelector } from '@hooks'
import { getOptionsTabsForVisType } from '@modules/options'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'
import type { OptionsTabKey } from '@types'
import { useCallback, useMemo, useState, type FC, type FormEvent } from 'react'
import { OptionsTabContent } from './options-tab-content'

const FORM_ID = 'options-modal-form'

type OptionsModalProps = {
    onClose: () => void
}

export const OptionsModal: FC<OptionsModalProps> = ({ onClose }) => {
    const visType = useAppSelector(getVisUiConfigVisualizationType)

    const [activeTabKey, setActiveTabKey] = useState<OptionsTabKey>('data')

    const optionsTabs = useMemo(
        () => getOptionsTabsForVisType(visType),
        [visType]
    )

    const onSubmit = useCallback(
        (event: FormEvent) => {
            event.preventDefault()
            onClose()
        },
        [onClose]
    )

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
                <form onSubmit={onSubmit} id={FORM_ID}>
                    <OptionsTabContent
                        tabKey={activeTabKey}
                        visType={visType}
                    />
                </form>
            </ModalContent>
            <ModalActions dataTest={'options-modal-actions'}>
                <ButtonStrip>
                    <Button
                        primary
                        type="submit"
                        form={FORM_ID}
                        dataTest={'options-modal-action-hide'}
                    >
                        {i18n.t('Hide')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
