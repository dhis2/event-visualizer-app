import { AddToLayoutButton } from '@components/dimension-modal/add-to-layout-button'
import { ConditionsModalContent } from '@components/dimension-modal/conditions-modal-content/conditions-modal-content'
import { DynamicDimensionModalContent } from '@components/dimension-modal/dynamic-dimension-modal-content/dynamic-dimension-modal-content'
import { OrgUnitDimensionModalContent } from '@components/dimension-modal/orgunit-dimension-modal-content'
import { PeriodDimensionModalContent } from '@components/dimension-modal/period-dimension-modal-content'
import { StatusDimensionModalContent } from '@components/dimension-modal/status-dimension-modal-content'
import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import i18n from '@dhis2/d2-i18n'
import { Button } from '@dhis2/ui'
import {
    useAppDispatch,
    useAppSelector,
    useDimensionMetadataItem,
    useProgramStageMetadataItem,
} from '@hooks'
import { isDimensionInLayout } from '@modules/layout'
import { isDimensionMetadataItem } from '@modules/metadata'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import {
    getUiActiveDimensionModal,
    getUiDimensionDialogMode,
    toggleUiDimensionDialogMode,
} from '@store/ui-slice'
import { getVisUiConfigLayout } from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'
import { useCallback, useMemo, type FC } from 'react'
import { DimensionDialogHeader } from './dimension-dialog-header'
import classes from './styles/dimension-dialog.module.css'

type DimensionDialogContentProps = {
    dimension: DimensionMetadataItem
}

const DimensionDialogContent: FC<DimensionDialogContentProps> = ({
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

type DimensionDialogShellProps = {
    onClose: () => void
}

export const DimensionDialogShell: FC<DimensionDialogShellProps> = ({
    onClose,
}) => {
    const dataTest = 'dimension-dialog'

    const dispatch = useAppDispatch()
    const layout = useAppSelector(getVisUiConfigLayout)
    const dimensionId = useAppSelector(
        getUiActiveDimensionModal
    ) as LayoutDimension['id']
    const dimension = useDimensionMetadataItem(dimensionId)
    const mode = useAppSelector(getUiDimensionDialogMode)

    const isInLayout = isDimensionInLayout(layout, dimensionId)

    const stage = useProgramStageMetadataItem(dimension?.programStageId)

    /* XXX: this logic might need to include more dimension types
       for example per-stage ou and period dimensions */
    const dialogTitle = useMemo(
        () =>
            stage?.name &&
            dimension?.dimensionType &&
            ![
                'ORGANISATION_UNIT',
                'STATUS',
                'PERIOD',
                'CATEGORY',
                'CATEGORY_OPTION_GROUP_SET',
                'ORGANISATION_UNIT_GROUP_SET',
            ].includes(dimension.dimensionType)
                ? `${dimension.name} - ${stage.name}`
                : (dimension?.name ?? ''),
        [dimension?.dimensionType, dimension?.name, stage?.name]
    )

    const onUpdate = useCallback(() => {
        dispatch(tUpdateCurrentVisFromVisUiConfig())
        onClose()
    }, [dispatch, onClose])

    const onToggleMode = useCallback(() => {
        dispatch(toggleUiDimensionDialogMode())
    }, [dispatch])

    if (!isDimensionMetadataItem(dimension)) {
        throw new Error(
            `Invalid dimension metadata for dimension id: ${dimensionId}`
        )
    }

    return (
        <>
            <DimensionDialogHeader
                title={dialogTitle}
                mode={mode}
                onToggleMode={onToggleMode}
                onClose={onClose}
                dataTest={`${dataTest}-header`}
            />
            <div
                className={classes.scrollBody}
                data-test={`${dataTest}-content`}
            >
                <DimensionDialogContent dimension={dimension} />
            </div>
            <div className={classes.footer} data-test={`${dataTest}-actions`}>
                {isInLayout ? (
                    <Button
                        type="button"
                        primary
                        small
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
            </div>
        </>
    )
}
