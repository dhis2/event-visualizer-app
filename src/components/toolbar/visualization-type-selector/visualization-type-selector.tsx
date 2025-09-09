import { Popper, Layer } from '@dhis2/ui'
import cx from 'classnames'
import type { FC } from 'react'
import { useState, useRef } from 'react'
import { ListItemIcon } from './list-item-icon'
import classes from './styles/visualization-type-selector.module.css'
import { VisualizationTypeListItem } from './visualization-type-list-item'
import { ArrowDown } from '@assets/arrow-down'
import type { SupportedVisType } from '@constants/visualization-types'
import { SUPPORTED_VIS_TYPES } from '@constants/visualization-types'
import { visTypeDisplayNames, ToolbarSidebar } from '@dhis2/analytics'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getVisTypeDescriptions } from '@modules/visualization'
import {
    setVisUiConfigVisualizationType,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'

export const VisualizationTypeSelector: FC = () => {
    const dispatch = useAppDispatch()

    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)

    const [listIsOpen, setListIsOpen] = useState(false)

    const toggleList = () => setListIsOpen(!listIsOpen)

    const onItemClick = () => {
        console.log('TBD run clearing on the store if needed')
    }

    const handleListItemClick = (visualizationType: SupportedVisType) => () => {
        dispatch(setVisUiConfigVisualizationType(visualizationType))
        onItemClick()
        toggleList()
    }

    const buttonRef = useRef<HTMLDivElement>(null)

    return (
        <>
            <ToolbarSidebar isHidden={false}>
                <div
                    onClick={toggleList}
                    ref={buttonRef}
                    className={cx(classes.button, {
                        [classes.listIsOpen]: listIsOpen,
                    })}
                    data-test={'visualization-type-selector-button'}
                >
                    <ListItemIcon
                        iconType={visualizationType}
                        style={{ width: 24, height: 24 }}
                    />
                    <span
                        className={classes.selectedVizTypeLabel}
                        data-test="visualization-type-selector-currently-selected-text"
                    >
                        {visTypeDisplayNames[visualizationType]}
                    </span>
                    <span
                        className={cx(classes.arrowIcon, {
                            [classes.listIsOpen]: listIsOpen,
                        })}
                    >
                        <ArrowDown />
                    </span>
                </div>
            </ToolbarSidebar>
            {listIsOpen && (
                <Layer onBackdropClick={toggleList}>
                    <Popper reference={buttonRef} placement="bottom-start">
                        <div className={classes.cardContainer}>
                            <div data-test="visualization-type-selector-card">
                                <div className={classes.listContainer}>
                                    <div className={classes.listSection}>
                                        {SUPPORTED_VIS_TYPES.map((visType) => (
                                            <VisualizationTypeListItem
                                                key={visType}
                                                iconType={visType}
                                                label={
                                                    visTypeDisplayNames[visType]
                                                }
                                                description={
                                                    getVisTypeDescriptions()[
                                                        visType
                                                    ]
                                                }
                                                isSelected={
                                                    visType ===
                                                    visualizationType
                                                }
                                                onClick={handleListItemClick(
                                                    visType
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Popper>
                </Layer>
            )}
        </>
    )
}
