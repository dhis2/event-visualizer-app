import i18n from '@dhis2/d2-i18n'
import { ButtonStrip, Button } from '@dhis2/ui'
import { useAppDispatch, useAppSelector } from '@hooks'
import { isDimensionInLayout } from '@modules/layout'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import { getVisUiConfigLayout } from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'
import cx from 'classnames'
import { useCallback, type FC, type KeyboardEvent } from 'react'
import { AddToLayoutButton } from './add-to-layout-button'
import { ConditionsModalContent } from './conditions-modal-content/conditions-modal-content'
import { DynamicDimensionModalContent } from './dynamic-dimension-modal-content/dynamic-dimension-modal-content'
import { OrgUnitDimensionModalContent } from './orgunit-dimension-modal-content'
import { PeriodDimensionModalContent } from './period-dimension-modal-content'
import { StatusDimensionModalContent } from './status-dimension-modal-content'
import classes from './styles/dimension-modal.module.css'

type DimensionPopoverContentProps = {
    dimension: DimensionMetadataItem
}

const DimensionPopoverContent: FC<DimensionPopoverContentProps> = ({
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

type DimensionPopoverCardProps = {
    dimension: DimensionMetadataItem
    onClose: () => void
    showArrow?: boolean
}

export const DimensionPopoverCard: FC<DimensionPopoverCardProps> = ({
    dimension,
    onClose,
    showArrow = false,
}) => {
    const dataTest = 'dimension-popover'

    const dispatch = useAppDispatch()
    const layout = useAppSelector(getVisUiConfigLayout)
    const isInLayout = isDimensionInLayout(layout, dimension.id)

    const onUpdate = useCallback(() => {
        dispatch(tUpdateCurrentVisFromVisUiConfig())
        onClose()
    }, [dispatch, onClose])

    const onKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key === 'Escape') {
                event.stopPropagation()
                onClose()
            }
        },
        [onClose]
    )

    return (
        <div
            className={cx(classes.popoverCard, {
                [classes.withArrow]: showArrow,
            })}
            data-test={dataTest}
            onKeyDown={onKeyDown}
            role="dialog"
        >
            {showArrow && <span className={classes.popoverArrow} />}
            <div
                className={classes.popoverContent}
                data-test={`${dataTest}-content`}
            >
                <DimensionPopoverContent dimension={dimension} />
            </div>
            <footer
                className={classes.popoverFooter}
                data-test={`${dataTest}-actions`}
            >
                <ButtonStrip>
                    <Button
                        type="button"
                        small
                        secondary
                        onClick={onClose}
                        dataTest={`${dataTest}-action-cancel`}
                    >
                        {i18n.t('Hide')}
                    </Button>
                    {isInLayout ? (
                        <Button
                            type="button"
                            small
                            primary
                            onClick={onUpdate}
                            dataTest={`${dataTest}-action-confirm`}
                        >
                            {i18n.t('Update')}
                        </Button>
                    ) : (
                        <AddToLayoutButton
                            dimensionId={dimension.id}
                            onClick={onClose}
                            dataTest={`${dataTest}-action-confirm`}
                        />
                    )}
                </ButtonStrip>
            </footer>
        </div>
    )
}
