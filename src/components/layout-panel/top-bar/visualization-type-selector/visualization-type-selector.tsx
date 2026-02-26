import i18n from '@dhis2/d2-i18n'
import {
    Popper,
    Layer,
    IconChevronDown16,
    IconVisualizationLinelist16,
    IconVisualizationPivotTable16,
} from '@dhis2/ui'
import cx from 'classnames'
import type { FC, ReactNode } from 'react'
import { useState, useRef } from 'react'
import classes from './styles/visualization-type-selector.module.css'
import {
    AGGREGATED_VISUALIZATION_TYPES,
    INDIVIDUAL_VISUALIZATION_TYPES,
} from '@constants/visualization-types'
import { visTypeDisplayNames } from '@dhis2/analytics'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    setVisUiConfigVisualizationType,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import type { VisualizationType } from '@types'

const visTypeIcons: Record<VisualizationType, ReactNode> = {
    LINE_LIST: <IconVisualizationLinelist16 />,
    PIVOT_TABLE: <IconVisualizationPivotTable16 />,
}

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

export const VisualizationTypeSelector: FC = () => {
    const dispatch = useAppDispatch()

    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)

    const [listIsOpen, setListIsOpen] = useState(false)

    const toggleList = () => setListIsOpen(!listIsOpen)

    const onItemClick = () => {
        console.log('TBD run clearing on the store if needed')
    }

    const handleListItemClick =
        (visualizationType: VisualizationType) => () => {
            dispatch(setVisUiConfigVisualizationType(visualizationType))
            onItemClick()
            toggleList()
        }

    const buttonRef = useRef<HTMLDivElement>(null)

    return (
        <>
            <div
                role="button"
                onClick={toggleList}
                ref={buttonRef}
                className={cx(classes.button, {
                    [classes.listIsOpen]: listIsOpen,
                })}
                data-test={'visualization-type-selector-button'}
            >
                {visTypeIcons[visualizationType]}
                <span
                    className={classes.selectedVizTypeLabel}
                    data-test="visualization-type-selector-currently-selected-text"
                >
                    {visTypeDisplayNames[visualizationType]}
                </span>
                <span className={classes.chevron}>
                    <IconChevronDown16 />
                </span>
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
                                </div>
                            </div>
                        </div>
                    </Popper>
                </Layer>
            )}
        </>
    )
}
