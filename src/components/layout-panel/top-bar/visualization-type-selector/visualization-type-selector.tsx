import {
    AGGREGATED_VISUALIZATION_TYPES,
    INDIVIDUAL_VISUALIZATION_TYPES,
} from '@constants/visualization-types'
import { visTypeDisplayNames } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import {
    Popper,
    Layer,
    IconChevronDown16,
    IconVisualizationLinelist16,
    IconVisualizationPivotTable16,
    IconVisualizationColumn16,
    IconVisualizationBar16,
    IconVisualizationLine16,
    IconVisualizationArea16,
} from '@dhis2/ui'
import { useAppDispatch, useAppSelector, useMetadataStore } from '@hooks'
import { convertLayoutForVisType } from '@modules/layout'
import {
    setVisUiConfigLayout,
    setVisUiConfigVisualizationType,
    getVisUiConfigLayout,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import type { Layout, VisualizationType } from '@types'
import cx from 'classnames'
import type { FC, ReactNode } from 'react'
import { useState, useRef } from 'react'
import { ConversionConfirmationModal } from './conversion-confirmation-modal'
import classes from './styles/visualization-type-selector.module.css'

const visTypeIcons: Record<VisualizationType, ReactNode> = {
    LINE_LIST: <IconVisualizationLinelist16 />,
    PIVOT_TABLE: <IconVisualizationPivotTable16 />,
}

/* Demo-only: aggregate chart types shown as unselectable "Coming soon" teasers
 * for the plenary demo. Remove along with the rest of the demo features. */
const COMING_SOON_VIS_TYPES: Array<{ label: string; icon: ReactNode }> = [
    { label: i18n.t('Column'), icon: <IconVisualizationColumn16 /> },
    { label: i18n.t('Bar'), icon: <IconVisualizationBar16 /> },
    { label: i18n.t('Line'), icon: <IconVisualizationLine16 /> },
    { label: i18n.t('Area'), icon: <IconVisualizationArea16 /> },
]

type ListItemProps = {
    visType: VisualizationType
    isSelected: boolean
    onClick: () => void
}

export const ListItem: FC<ListItemProps> = ({
    visType,
    isSelected,
    onClick,
}) => {
    return (
        <button
            className={cx(classes.gridItem, {
                [classes.active]: isSelected,
            })}
            onClick={onClick}
            type="button"
        >
            {visTypeIcons[visType]}
            <span className={classes.gridItemLabel}>
                {visTypeDisplayNames[visType]}
            </span>
        </button>
    )
}

const ComingSoonListItem: FC<{ label: string; icon: ReactNode }> = ({
    label,
    icon,
}) => (
    <div
        className={cx(classes.gridItem, classes.comingSoon)}
        aria-disabled="true"
    >
        <span className={classes.comingSoonBadge}>{i18n.t('Coming soon')}</span>
        {icon}
        <span className={classes.gridItemLabel}>{label}</span>
    </div>
)

type PendingConversion = {
    targetVisType: VisualizationType
    newLayout: Layout
    discardedNames: string[]
}

export const VisualizationTypeSelector: FC = () => {
    const dispatch = useAppDispatch()
    const metadataStore = useMetadataStore()

    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const layout = useAppSelector(getVisUiConfigLayout)

    const [listIsOpen, setListIsOpen] = useState(false)
    const [pendingConversion, setPendingConversion] =
        useState<PendingConversion | null>(null)

    const toggleList = () => setListIsOpen(!listIsOpen)

    const applyChange = (
        targetVisType: VisualizationType,
        newLayout: Layout
    ) => {
        dispatch(setVisUiConfigLayout(newLayout))
        dispatch(setVisUiConfigVisualizationType(targetVisType))
    }

    const handleListItemClick = (nextVisType: VisualizationType) => () => {
        if (nextVisType === visualizationType) {
            setListIsOpen(false)
            return
        }
        const { newLayout, discardedDimensionIds } = convertLayoutForVisType({
            layout,
            targetVisType: nextVisType,
            getDimension: (id) => metadataStore.getDimensionMetadataItem(id),
        })
        if (discardedDimensionIds.length === 0) {
            applyChange(nextVisType, newLayout)
            setListIsOpen(false)
            return
        }
        const discardedNames = discardedDimensionIds.map(
            (id) => metadataStore.getDimensionMetadataItem(id)?.name ?? id
        )
        setPendingConversion({
            targetVisType: nextVisType,
            newLayout,
            discardedNames,
        })
        setListIsOpen(false)
    }

    const buttonRef = useRef<HTMLDivElement>(null)

    return (
        <>
            <div ref={buttonRef}>
                <button
                    onClick={toggleList}
                    className={cx(classes.button, {
                        [classes.listIsOpen]: listIsOpen,
                    })}
                    data-test={'visualization-type-selector-button'}
                >
                    {visTypeIcons[visualizationType]}
                    <span
                        className={classes.selectedVisTypeLabel}
                        data-test="visualization-type-selector-currently-selected-text"
                    >
                        {visTypeDisplayNames[visualizationType]}
                    </span>
                    <span className={classes.chevron}>
                        <IconChevronDown16 />
                    </span>
                </button>
            </div>
            {listIsOpen && (
                <Layer onBackdropClick={toggleList}>
                    <Popper reference={buttonRef} placement="bottom-start">
                        <div
                            className={classes.container}
                            data-test="visualization-type-selector-list"
                        >
                            <div className={classes.section}>
                                <div className={classes.sectionHeader}>
                                    {i18n.t('Individual data view')}
                                </div>
                                <div className={classes.grid}>
                                    {INDIVIDUAL_VISUALIZATION_TYPES.map(
                                        (visType) => (
                                            <ListItem
                                                key={visType}
                                                visType={visType}
                                                isSelected={
                                                    visType ===
                                                    visualizationType
                                                }
                                                onClick={handleListItemClick(
                                                    visType
                                                )}
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                            <div className={classes.section}>
                                <div className={classes.sectionHeader}>
                                    {i18n.t('Aggregated view')}
                                </div>
                                <div className={classes.grid}>
                                    {AGGREGATED_VISUALIZATION_TYPES.map(
                                        (visType) => (
                                            <ListItem
                                                key={visType}
                                                visType={visType}
                                                isSelected={
                                                    visType ===
                                                    visualizationType
                                                }
                                                onClick={handleListItemClick(
                                                    visType
                                                )}
                                            />
                                        )
                                    )}
                                    {COMING_SOON_VIS_TYPES.map(
                                        ({ label, icon }) => (
                                            <ComingSoonListItem
                                                key={label}
                                                label={label}
                                                icon={icon}
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </Popper>
                </Layer>
            )}
            {pendingConversion && (
                <ConversionConfirmationModal
                    targetVisType={pendingConversion.targetVisType}
                    discardedDimensionNames={pendingConversion.discardedNames}
                    onConfirm={() => {
                        applyChange(
                            pendingConversion.targetVisType,
                            pendingConversion.newLayout
                        )
                        setPendingConversion(null)
                    }}
                    onCancel={() => setPendingConversion(null)}
                />
            )}
        </>
    )
}
