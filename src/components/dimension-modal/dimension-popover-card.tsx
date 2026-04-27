import i18n from '@dhis2/d2-i18n'
import { ButtonStrip, Button, Tab, TabBar, Tooltip } from '@dhis2/ui'
import {
    useAppDispatch,
    useAppSelector,
    useCurrentUser,
    useProgramStageMetadataItem,
} from '@hooks'
import { getDimensionIdParts } from '@modules/dimension'
import { isDimensionInLayout } from '@modules/layout'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import {
    getVisUiConfigLayout,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'
import cx from 'classnames'
import {
    useCallback,
    useMemo,
    useState,
    type FC,
    type KeyboardEvent,
    type ReactNode,
} from 'react'
import { AddToLayoutButton } from './add-to-layout-button'
import { ConditionsModalContent } from './conditions-modal-content/conditions-modal-content'
import { RepeatedEventsTabContent } from './conditions-modal-content/repeated-events-tab-content'
import { DynamicDimensionModalContent } from './dynamic-dimension-modal-content/dynamic-dimension-modal-content'
import { OrgUnitDimensionModalContent } from './orgunit-dimension-modal-content'
import { PeriodDimensionModalContent } from './period-dimension-modal-content'
import { StatusDimensionModalContent } from './status-dimension-modal-content'
import classes from './styles/dimension-modal.module.css'

export type DimensionPopoverTab = 'info' | 'filters' | 'repeatability'

const TAB_INFO: DimensionPopoverTab = 'info'
const TAB_FILTERS: DimensionPopoverTab = 'filters'
const TAB_REPEATABILITY: DimensionPopoverTab = 'repeatability'

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
    initialTab?: DimensionPopoverTab
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

const getSidebarDimensionInfo = (
    dimension: DimensionMetadataItem
): string | undefined => {
    const isStageDimension = Boolean(dimension.programStageId)

    switch (dimension.dimensionId) {
        case 'ou':
            return isStageDimension
                ? i18n.t(
                      'The org. unit where the event was registered for this program stage.'
                  )
                : i18n.t(
                      'The org. unit collected during enrollment. Applies to the latest enrollment if there is more than one.'
                  )
        case 'enrollmentDate':
            return i18n.t(
                'The date the enrollment was registered. Select one or more periods to include enrollments from those periods.'
            )
        case 'incidentDate':
            return i18n.t(
                'The incident date recorded for the enrollment. Select one or more periods to include enrollments with incident dates in those periods.'
            )
        case 'programStatus':
            return i18n.t(
                'The current enrollment status, such as active, completed, or cancelled. Applies to the latest enrollment if there is more than one.'
            )
        case 'eventDate':
            return i18n.t(
                'The date the event occurred for this program stage. Select one or more periods to include events from those periods.'
            )
        case 'scheduledDate':
            return i18n.t(
                'The scheduled date for events in this program stage. Select one or more periods to include events scheduled in those periods.'
            )
        case 'eventStatus':
            return i18n.t(
                'The status of events in this program stage, such as active, completed, skipped, or scheduled.'
            )
        case 'lastUpdated':
            return i18n.t(
                'The date when the event, enrollment, or tracked entity was most recently updated.'
            )
        case 'lastUpdatedBy':
            return i18n.t(
                'The user who most recently updated the event, enrollment, or tracked entity.'
            )
        case 'created':
            return i18n.t(
                'The date when the event, enrollment, or tracked entity was created.'
            )
        case 'createdBy':
            return i18n.t(
                'The user who created the event, enrollment, or tracked entity.'
            )
        case 'completed':
            return i18n.t(
                'The date when the event or enrollment was completed.'
            )
        default:
            return undefined
    }
}

type SidebarDimensionInfoBoxProps = {
    dimension: DimensionMetadataItem
}

const SidebarDimensionInfoBox: FC<SidebarDimensionInfoBoxProps> = ({
    dimension,
}) => {
    const info = getSidebarDimensionInfo(dimension)

    if (!info) {
        return null
    }

    return (
        <div
            className={classes.sidebarInfoBox}
            data-test="dimension-popover-sidebar-info"
        >
            {info}
        </div>
    )
}

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
    initialTab = TAB_FILTERS,
}) => {
    const dataTest = 'dimension-popover'

    const dispatch = useAppDispatch()
    const currentUser = useCurrentUser()
    const layout = useAppSelector(getVisUiConfigLayout)
    const visType = useAppSelector(getVisUiConfigVisualizationType)
    const isInLayout = isDimensionInLayout(layout, dimension.id)
    const [activeTab, setActiveTab] = useState<DimensionPopoverTab>(initialTab)
    const programStageId =
        dimension.dimensionType === 'DATA_ELEMENT'
            ? (dimension.programStageId ??
              getDimensionIdParts({ id: dimension.id }).programStageId)
            : undefined
    const programStage = useProgramStageMetadataItem(programStageId)
    const isRepeatabilityAvailable =
        visType === 'LINE_LIST' &&
        dimension.dimensionType === 'DATA_ELEMENT' &&
        Boolean(programStage?.repeatable)
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

    const onKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key === 'Escape') {
                event.stopPropagation()
                onClose()
            }
        },
        [onClose]
    )

    const renderTab = ({
        key,
        label,
        disabled,
        tooltip,
    }: {
        key: DimensionPopoverTab
        label: string
        disabled?: boolean
        tooltip?: string
    }) => {
        const tab = (
            <Tab
                key={key}
                onClick={() => setActiveTab(key)}
                selected={activeTab === key}
                disabled={disabled}
            >
                {label}
            </Tab>
        )

        return disabled && tooltip ? (
            <Tooltip
                key={`${key}-tooltip`}
                placement="bottom"
                content={tooltip}
                dataTest={`${dataTest}-${key}-tooltip`}
            >
                {tab}
            </Tooltip>
        ) : (
            tab
        )
    }

    const renderActiveTabContent = (): ReactNode => {
        switch (activeTab) {
            case TAB_INFO:
                return (
                    <>
                        <SidebarDimensionInfoBox dimension={dimension} />
                        <SidebarDimensionOverview
                            dimension={dimension}
                            lastUpdated={lastUpdated}
                        />
                    </>
                )
            case TAB_REPEATABILITY:
                return isRepeatabilityAvailable ? (
                    <RepeatedEventsTabContent dimensionId={dimension.id} />
                ) : null
            case TAB_FILTERS:
            default:
                return <DimensionPopoverContent dimension={dimension} />
        }
    }

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
                <TabBar
                    className={classes.popoverTabBar}
                    dataTest={`${dataTest}-tab-bar`}
                >
                    {renderTab({ key: TAB_INFO, label: i18n.t('Info') })}
                    {renderTab({
                        key: TAB_FILTERS,
                        label: i18n.t('Filters'),
                    })}
                    {renderTab({
                        key: TAB_REPEATABILITY,
                        label: i18n.t('Repeatability'),
                        disabled: !isRepeatabilityAvailable,
                        tooltip: i18n.t(
                            'Only available for repeatable data elements in line lists'
                        ),
                    })}
                </TabBar>
                {renderActiveTabContent()}
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
