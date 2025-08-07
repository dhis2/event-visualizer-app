import { visTypeDisplayNames, ToolbarSidebar } from '@dhis2/analytics'
import { Popper, Layer } from '@dhis2/ui'
import cx from 'classnames'
import React, { FC, useState, useRef } from 'react'
import { ArrowDown } from '../../../assets/arrow-down'
import { SUPPORTED_VIS_TYPES } from '../../../constants'
import type { SupportedVisType } from '../../../constants'
import {
    getVisTypeDescriptions,
    useVisTypesFilterByVersion,
} from '../../../modules/visualization'
import { ListItemIcon } from './list-item-icon'
import classes from './styles/visualization-type-selector.module.css'
import { VisualizationTypeListItem } from './visualization-type-list-item'

export const VisualizationTypeSelector: FC = () => {
    // TODO read this from the store
    const [visualizationType, setVisType] =
        useState<SupportedVisType>('PIVOT_TABLE')
    const [listIsOpen, setListIsOpen] = useState(false)

    const filterVisTypesByVersion = useVisTypesFilterByVersion()

    const toggleList = () => setListIsOpen(!listIsOpen)

    const onItemClick = () => {
        console.log('vis type selected')
    }

    const handleListItemClick = (visType: SupportedVisType) => () => {
        // TODO set this in the store
        setVisType(visType)
        onItemClick()
        toggleList()
    }

    const buttonRef = useRef()

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
                                        {SUPPORTED_VIS_TYPES.filter(
                                            filterVisTypesByVersion
                                        ).map((visType) => (
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
