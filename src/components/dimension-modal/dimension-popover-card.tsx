import i18n from '@dhis2/d2-i18n'
import { ButtonStrip, Button } from '@dhis2/ui'
import { useAppDispatch, useAppSelector, useCurrentUser } from '@hooks'
import { isDimensionInLayout } from '@modules/layout'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import { setUiActiveDimensionPopover } from '@store/ui-slice'
import { getVisUiConfigLayout } from '@store/vis-ui-config-slice'
import type { Axis, DimensionMetadataItem } from '@types'
import cx from 'classnames'
import {
    useCallback,
    useMemo,
    type FC,
    type KeyboardEvent,
    type ReactNode,
} from 'react'
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
    variant?: 'layout' | 'sidebar'
}

type SidebarDimensionOverviewProps = {
    dimension: DimensionMetadataItem
    lastUpdated: string
}

type OverviewDimension = DimensionMetadataItem & {
    dataElementGroups?: unknown
    description?: unknown
    displayDescription?: unknown
    code?: unknown
    lastUpdated?: unknown
    legendSets?: unknown
    optionSet?: unknown
}

type NamedMetadata = {
    name?: unknown
    displayName?: unknown
}

const getStringValue = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim().length > 0
        ? value.trim()
        : undefined

const formatEnumValue = (value: string): string =>
    value
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')

const getDimensionTypeLabel = (
    dimensionType: DimensionMetadataItem['dimensionType']
): string => {
    switch (dimensionType) {
        case 'DATA_ELEMENT':
            return i18n.t('Data element')
        case 'PROGRAM_ATTRIBUTE':
            return i18n.t('Tracked entity attribute')
        case 'PROGRAM_INDICATOR':
            return i18n.t('Program indicator')
        case 'ORGANISATION_UNIT':
            return i18n.t('Organisation unit')
        case 'ORGANISATION_UNIT_GROUP_SET':
            return i18n.t('Organisation unit group set')
        case 'CATEGORY':
            return i18n.t('Category')
        case 'CATEGORY_OPTION_GROUP_SET':
            return i18n.t('Category option group set')
        case 'STATUS':
            return i18n.t('Status')
        case 'PERIOD':
            return i18n.t('Period')
        case 'USER':
            return i18n.t('User')
        default:
            return formatEnumValue(dimensionType)
    }
}

const getNamedMetadataLabel = (metadata: unknown): string | undefined => {
    if (typeof metadata !== 'object' || metadata === null) {
        return undefined
    }

    const namedMetadata = metadata as NamedMetadata

    return (
        getStringValue(namedMetadata.displayName) ??
        getStringValue(namedMetadata.name)
    )
}

const getLegendSetLabels = (legendSets: unknown): string[] => {
    if (!Array.isArray(legendSets)) {
        return []
    }

    return legendSets
        .map(getNamedMetadataLabel)
        .filter((label): label is string => Boolean(label))
}

const getMetadataListLabels = (metadataList: unknown): string[] => {
    if (!Array.isArray(metadataList)) {
        return []
    }

    return metadataList
        .map(getNamedMetadataLabel)
        .filter((label): label is string => Boolean(label))
}

type OverviewItemProps = {
    label: string
    children: ReactNode
}

const OverviewItem: FC<OverviewItemProps> = ({ label, children }) => (
    <div className={classes.sidebarOverviewItem}>
        <dt>{label}</dt>
        <dd>{children}</dd>
    </div>
)

const SidebarDimensionOverview: FC<SidebarDimensionOverviewProps> = ({
    dimension,
    lastUpdated,
}) => {
    const overviewDimension = dimension as OverviewDimension
    const noneValue = i18n.t('None')
    const notAvailableValue = i18n.t('Not available')
    const description =
        getStringValue(overviewDimension.displayDescription) ??
        getStringValue(overviewDimension.description) ??
        noneValue
    const code = getStringValue(overviewDimension.code) ?? noneValue
    const optionSetLabel = getNamedMetadataLabel(overviewDimension.optionSet)
    const legendSetLabels = getLegendSetLabels(overviewDimension.legendSets)
    const dataElementGroupLabels = getMetadataListLabels(
        overviewDimension.dataElementGroups
    )

    return (
        <dl
            className={classes.sidebarOverview}
            data-test="dimension-popover-sidebar-overview"
        >
            <OverviewItem label={i18n.t('Name')}>{dimension.name}</OverviewItem>
            <OverviewItem label={i18n.t('Type')}>
                {getDimensionTypeLabel(dimension.dimensionType)}
            </OverviewItem>
            {dimension.valueType && (
                <OverviewItem label={i18n.t('Value type')}>
                    {formatEnumValue(dimension.valueType)}
                </OverviewItem>
            )}
            {optionSetLabel && (
                <OverviewItem label={i18n.t('Option set')}>
                    {optionSetLabel}
                </OverviewItem>
            )}
            {legendSetLabels.length > 0 && (
                <OverviewItem label={i18n.t('Legend set(s)')}>
                    {legendSetLabels.join(', ')}
                </OverviewItem>
            )}
            {dimension.dimensionType === 'DATA_ELEMENT' && (
                <OverviewItem label={i18n.t('Data element group(s)')}>
                    {dataElementGroupLabels.length > 0
                        ? dataElementGroupLabels.join(', ')
                        : noneValue}
                </OverviewItem>
            )}
            <OverviewItem label={i18n.t('Description')}>
                {description}
            </OverviewItem>
            <OverviewItem label={i18n.t('Code')}>{code}</OverviewItem>
            <OverviewItem label={i18n.t('ID')}>
                {dimension.dimensionId || dimension.id}
            </OverviewItem>
            <OverviewItem label={i18n.t('Last updated date')}>
                {lastUpdated || notAvailableValue}
            </OverviewItem>
        </dl>
    )
}

export const DimensionPopoverCard: FC<DimensionPopoverCardProps> = ({
    dimension,
    onClose,
    showArrow = false,
    variant = 'layout',
}) => {
    const dataTest = 'dimension-popover'

    const dispatch = useAppDispatch()
    const currentUser = useCurrentUser()
    const layout = useAppSelector(getVisUiConfigLayout)
    const isInLayout = isDimensionInLayout(layout, dimension.id)
    const isSidebarVariant = variant === 'sidebar'
    const dateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(currentUser.settings.uiLocale, {
                dateStyle: 'medium',
                timeStyle: 'short',
            }),
        [currentUser.settings.uiLocale]
    )
    const lastUpdated = useMemo(() => {
        const overviewDimension = dimension as OverviewDimension
        const rawLastUpdated = getStringValue(overviewDimension.lastUpdated)
        const emptyValue = i18n.t('Not available')

        if (!rawLastUpdated) {
            return emptyValue
        }

        const date = new Date(rawLastUpdated)

        return Number.isNaN(date.getTime())
            ? rawLastUpdated
            : dateFormatter.format(date)
    }, [dateFormatter, dimension])

    const onUpdate = useCallback(() => {
        dispatch(tUpdateCurrentVisFromVisUiConfig())
        onClose()
    }, [dispatch, onClose])

    const onAddToLayout = useCallback(
        (axisId: Axis) => {
            dispatch(
                setUiActiveDimensionPopover({
                    dimensionId: dimension.id,
                    source: 'layout',
                    axisId,
                })
            )
        },
        [dispatch, dimension.id]
    )

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
                {isSidebarVariant ? (
                    <>
                        {!isInLayout && (
                            <div
                                className={classes.sidebarOverviewActions}
                                data-test={`${dataTest}-sidebar-actions`}
                            >
                                <AddToLayoutButton
                                    dimensionId={dimension.id}
                                    onClick={onAddToLayout}
                                    dataTest={`${dataTest}-action-add-to-layout`}
                                    variant="buttons"
                                />
                            </div>
                        )}
                        <SidebarDimensionOverview
                            dimension={dimension}
                            lastUpdated={lastUpdated}
                        />
                    </>
                ) : (
                    <DimensionPopoverContent dimension={dimension} />
                )}
            </div>
            {!isSidebarVariant && (
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
            )}
        </div>
    )
}
