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
import { DynamicDimensionModalContent } from './dynamic-dimension-modal-content/dynamic-dimension-modal-content'
import { OrgUnitDimensionModalContent } from './orgunit-dimension-modal-content'
import { PeriodDimensionModalContent } from './period-dimension-modal-content'
import { StatusDimensionModalContent } from './status-dimension-modal-content'
import classes from './styles/dimension-modal.module.css'
import type { LayoutDimension } from '@components/layout-panel/chip'
import { useAppDispatch, useAppSelector, useMetadataItem } from '@hooks'
import { isStatusDimension } from '@modules/dimension'
import { isDimensionInLayout } from '@modules/layout'
import { isDimensionMetadataItem } from '@modules/metadata'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import { getUiActiveDimensionModal } from '@store/ui-slice'
import { getVisUiConfigLayout } from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'

type DimensionModalContentProps = {
    dimension: DimensionMetadataItem
}

const DimensionModalContent: FC<DimensionModalContentProps> = ({
    dimension,
}) => {
    // Check for special dimensions by ID (status dimensions don't have dimensionType)
    if (isStatusDimension(dimension.id)) {
        return <StatusDimensionModalContent dimension={dimension} />
    }

    // Check by dimensionType for other cases
    switch (dimension.dimensionType) {
        case 'ORGANISATION_UNIT':
            return <OrgUnitDimensionModalContent dimension={dimension} />
        case 'PERIOD':
            return <PeriodDimensionModalContent dimension={dimension} />
        case 'CATEGORY':
        case 'CATEGORY_OPTION_GROUP_SET':
        case 'ORGANISATION_UNIT_GROUP_SET':
            return <DynamicDimensionModalContent dimension={dimension} />
        default:
            return `Content for ${dimension.dimensionType}`
    }
}

type DimensionModalProps = {
    onClose: () => void
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
        throw new Error(
            `Invalid dimension metadata for dimension id: ${dimensionId}`
        )
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
                <DimensionModalContent
                    dimension={dimension as DimensionMetadataItem}
                />
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
