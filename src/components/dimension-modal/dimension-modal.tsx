import i18n from '@dhis2/d2-i18n'
import {
    Modal,
    ModalContent,
    ModalActions,
    ButtonStrip,
    ModalTitle,
    Button,
} from '@dhis2/ui'
import { useCallback, type FC } from 'react'
import { AddToLayoutButton } from './add-to-layout-button'
import classes from './styles/dimension-modal.module.css'
import { isDimensionMetadataItem } from '@components/app-wrapper/metadata-helpers/type-guards'
import type { LayoutDimension } from '@components/layout-panel/chip'
import { useAppDispatch, useAppSelector, useMetadataItem } from '@hooks'
import { isDimensionInLayout } from '@modules/layout'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import { getUiActiveDimensionModal } from '@store/ui-slice'
import { getVisUiConfigLayout } from '@store/vis-ui-config-slice'
import type { DimensionType } from '@types'

type DimensionModalProps = {
    onClose: () => void
}

const renderDimensionModalContent = (dimensionType: DimensionType) => {
    switch (dimensionType) {
        case 'ORGANISATION_UNIT':
        case 'STATUS':
            return `Content for fixed dimension ${dimensionType}`
        case 'PERIOD':
            return `Content for period dimension ${dimensionType}`
        case 'CATEGORY':
        case 'CATEGORY_OPTION_GROUP_SET':
        case 'ORGANISATION_UNIT_GROUP_SET':
            return `Content for dynamic dimension ${dimensionType}`

        default:
            return `Content for ${dimensionType}`
    }
}

export const DimensionModal: FC<DimensionModalProps> = ({ onClose }) => {
    const dataTest = 'dimension-modal'

    const dispatch = useAppDispatch()
    const layout = useAppSelector(getVisUiConfigLayout)
    const dimensionId = useAppSelector(
        getUiActiveDimensionModal
    ) as LayoutDimension['id']
    const dimension = useMetadataItem(dimensionId)

    const isInLayout = isDimensionInLayout(layout, dimensionId)

    const onUpdate = useCallback(() => {
        dispatch(tUpdateCurrentVisFromVisUiConfig())

        onClose()
    }, [dispatch, onClose])

    if (!isDimensionMetadataItem(dimension)) {
        throw new Error('Invalid dimension metadata')
    }

    return (
        <Modal onClose={onClose} dataTest={`${dataTest}`} position="top" large>
            <ModalTitle dataTest={`${dataTest}-title`}>
                {dimension?.name}
            </ModalTitle>
            <ModalContent
                dataTest={`${dataTest}-content`}
                className={classes.modalContent}
            >
                {renderDimensionModalContent(dimension.dimensionType)}
            </ModalContent>
            <ModalActions dataTest={`${dataTest}-actions`}>
                <ButtonStrip>
                    <Button
                        type="button"
                        secondary
                        onClick={onClose}
                        dataTest={`${dataTest}-action-cancel`}
                    >
                        {i18n.t('Hide')}
                    </Button>
                    {isInLayout ? (
                        <Button
                            type="button"
                            primary
                            onClick={onUpdate}
                            dataTest={`${dataTest}-action-confirm`}
                        >
                            {i18n.t('Update')}
                        </Button>
                    ) : (
                        <AddToLayoutButton
                            onClick={onClose}
                            dataTest={`${dataTest}-action-confirm`}
                        />
                    )}
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
