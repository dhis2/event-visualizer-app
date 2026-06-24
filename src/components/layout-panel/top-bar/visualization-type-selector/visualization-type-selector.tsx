import {
    AGGREGATED_VISUALIZATION_TYPES,
    INDIVIDUAL_VISUALIZATION_TYPES,
} from '@constants/visualization-types'
import { visTypeDisplayNames } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import {
    Popper,
    Layer,
    Tooltip,
    IconChevronDown16,
    IconVisualizationLinelist16,
    IconVisualizationPivotTable16,
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

const HomeIcon: FC = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
    >
        <path
            fillRule="evenodd"
            d="M13 9.414V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V9.414l1-1V13h2v-3a1 1 0 0 1 1-1h2l.103.005A1 1 0 0 1 10 10v3h2V8.414l1 1ZM7 13h2v-3H7v3Z"
            clipRule="evenodd"
        />
        <path d="M8.048 2.002a1.002 1.002 0 0 1 .659.291l6 6L14 9 8 3 2 9l-.707-.707 6-6 .076-.068a.994.994 0 0 1 .679-.223ZM13 5.172l-1-1V2h1v3.172Z" />
    </svg>
)

type ListItemProps = {
    visType: VisualizationType
    isSelected: boolean
    isDefault: boolean
    onClick: () => void
    onSetDefault: () => void
}

export const ListItem: FC<ListItemProps> = ({
    visType,
    isSelected,
    isDefault,
    onClick,
    onSetDefault,
}) => {
    const homeLabel = isDefault
        ? i18n.t('Current default')
        : i18n.t('Set as default')
    return (
        <div className={classes.gridItemWrap}>
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
            <Tooltip content={homeLabel} closeDelay={0}>
                {({ onMouseOver, onMouseOut, ref }) => (
                    <span
                        ref={ref}
                        className={cx(classes.homeMarker, {
                            [classes.isDefault]: isDefault,
                        })}
                    >
                        <button
                            className={classes.homeMarkerButton}
                            onClick={onSetDefault}
                            onMouseOver={onMouseOver}
                            onMouseOut={onMouseOut}
                            type="button"
                            aria-label={homeLabel}
                        >
                            <HomeIcon />
                        </button>
                    </span>
                )}
            </Tooltip>
        </div>
    )
}

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
    /* prototype: local-only "default vis type" marker */
    const [defaultVisType, setDefaultVisType] =
        useState<VisualizationType>(visualizationType)

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
                                                isDefault={
                                                    visType === defaultVisType
                                                }
                                                onClick={handleListItemClick(
                                                    visType
                                                )}
                                                onSetDefault={() =>
                                                    setDefaultVisType(visType)
                                                }
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
                                                isDefault={
                                                    visType === defaultVisType
                                                }
                                                onClick={handleListItemClick(
                                                    visType
                                                )}
                                                onSetDefault={() =>
                                                    setDefaultVisType(visType)
                                                }
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
