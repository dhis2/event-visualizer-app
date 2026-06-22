import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import { useLayoutDimensions } from '@components/layout-panel/use-layout-dimensions'
import i18n from '@dhis2/d2-i18n'
import {
    Modal,
    ModalContent,
    ModalActions,
    ButtonStrip,
    ModalTitle,
    Button,
} from '@dhis2/ui'
import {
    useAppDispatch,
    useAppSelector,
    useDimensionMetadataItem,
} from '@hooks'
import { isDimensionInLayout } from '@modules/layout'
import { isDimensionMetadataItem } from '@modules/metadata'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import { getUiActiveDimensionModal } from '@store/ui-slice'
import {
    getVisUiConfigLayout,
    getVisUiConfigLayoutAllDimensionIds,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'
import { useCallback, useMemo, type FC } from 'react'
import { AddToLayoutButton } from './add-to-layout-button'
import { ConditionsModalContent } from './conditions-modal-content/conditions-modal-content'
import { DynamicDimensionModalContent } from './dynamic-dimension-modal-content/dynamic-dimension-modal-content'
import { OrgUnitDimensionModalContent } from './orgunit-dimension-modal-content'
import { PeriodDimensionModalContent } from './period-dimension-modal-content'
import { StatusDimensionModalContent } from './status-dimension-modal-content'
import classes from './styles/dimension-modal.module.css'

type DimensionModalContentProps = {
    dimension: DimensionMetadataItem
}

const DimensionModalContent: FC<DimensionModalContentProps> = ({
    dimension,
}) => {
    switch (dimension.dimensionType) {
        case 'ORGANISATION_UNIT':
            return <OrgUnitDimensionModalContent dimension={dimension} />
        case 'STATUS':
            return <StatusDimensionModalContent dimension={dimension} />
        case 'PERIOD':
            return <PeriodDimensionModalContent dimension={dimension} />
        case 'CATEGORY':
        case 'CATEGORY_OPTION_GROUP_SET':
        case 'ORGANISATION_UNIT_GROUP_SET':
            return <DynamicDimensionModalContent dimension={dimension} />
        default:
            return <ConditionsModalContent dimension={dimension} />
    }
}

type DimensionModalProps = {
    onClose: () => void
}

export const DimensionModal: FC<DimensionModalProps> = ({ onClose }) => {
    const dataTest = 'dimension-modal'

    const dispatch = useAppDispatch()
    const layout = useAppSelector(getVisUiConfigLayout)
    const layoutDimensionIds = useAppSelector(
        getVisUiConfigLayoutAllDimensionIds
    )
    const dimensionId = useAppSelector(
        getUiActiveDimensionModal
    ) as LayoutDimension['id']
    const dimension = useDimensionMetadataItem(dimensionId)

    const isInLayout = isDimensionInLayout(layout, dimensionId)

    const suffixDimensionIds = useMemo(
        () =>
            layoutDimensionIds.includes(dimensionId)
                ? layoutDimensionIds
                : [...layoutDimensionIds, dimensionId],
        [layoutDimensionIds, dimensionId]
    )
    const layoutDimensions = useLayoutDimensions({
        dimensionIds: suffixDimensionIds,
    })
    const suffix = useMemo(
        () => layoutDimensions.find(({ id }) => id === dimensionId)?.suffix,
        [layoutDimensions, dimensionId]
    )

    const modalTitle = suffix
        ? `${dimension?.name} · ${suffix}`
        : dimension?.name

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
            <ModalTitle dataTest={`${dataTest}-title`}>{modalTitle}</ModalTitle>
            <ModalContent
                dataTest={`${dataTest}-content`}
                className={classes.modalContent}
            >
                {/* Key on the dimension id so switching dimensions remounts
                    the content, resetting state that is derived once on mount
                    (e.g. the Show all / Filter radio mode). */}
                <DimensionModalContent
                    key={dimension.id}
                    dimension={dimension}
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
