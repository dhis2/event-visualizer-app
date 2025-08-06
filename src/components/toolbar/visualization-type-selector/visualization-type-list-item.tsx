import cx from 'classnames'
import React, { FC } from 'react'
import { ListItemIcon } from './list-item-icon'
import classes from './styles/visualization-type-selector.module.css'

type VisualizationTypeListItemProps = {
    description: string
    iconType: string
    isSelected: boolean
    label: string
    onClick: () => void
}

export const VisualizationTypeListItem: FC<VisualizationTypeListItemProps> = ({
    iconType,
    label,
    description,
    isSelected,
    onClick,
}) => {
    return (
        <div
            className={cx(classes.listItem, {
                [classes.listItemActive]: isSelected,
            })}
            onClick={onClick}
        >
            <div className={classes.listItemIcon}>
                {
                    <ListItemIcon
                        iconType={iconType}
                        style={{ width: 48, height: 48 }}
                    />
                }
            </div>
            <div className={classes.listItemText}>
                <p className={classes.listItemName}>{label}</p>
                <p className={classes.listItemDescription}>{description}</p>
            </div>
        </div>
    )
}
