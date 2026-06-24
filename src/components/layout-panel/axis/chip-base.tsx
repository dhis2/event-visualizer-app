import { IconGroupedRanges } from '@assets/icon-grouped-ranges'
import { DimensionTypeIcon } from '@components/shared/dimension-type-icon'
import i18n from '@dhis2/d2-i18n'
import cx from 'classnames'
import type React from 'react'
import type { LayoutDimension } from './chip'
import classes from './styles/chip-base.module.css'

// Presentational component used by dnd - do not add redux or dnd functionality

export interface ChipBaseProps {
    dimensionType: LayoutDimension['dimensionType']
    dimensionName: string
    itemsText: string
    suffix?: string
    isEmpty?: boolean
    isDragging?: boolean
    isGroupedIntoRanges?: boolean
    onClick: () => void
}

export const ChipBase: React.FC<ChipBaseProps> = ({
    dimensionType,
    dimensionName,
    itemsText,
    suffix,
    isEmpty,
    isDragging,
    isGroupedIntoRanges,
    onClick,
}) => (
    <button
        type="button"
        className={cx(classes.chipBase, {
            [classes.empty]: isEmpty,
            [classes.dragging]: isDragging,
        })}
        onClick={onClick}
    >
        {dimensionType && (
            <div className={classes.leftIcon}>
                <DimensionTypeIcon dimensionType={dimensionType} />
            </div>
        )}
        <span className={classes.label}>
            <span className={classes.primary}>{dimensionName}</span>
            {suffix && (
                <span
                    className={classes.secondary}
                    data-test="chip-suffix"
                >{`· ${suffix}`}</span>
            )}
        </span>
        <span className={classes.items} data-test="chip-items">
            {itemsText}
        </span>
        {isGroupedIntoRanges && (
            <span
                className={classes.groupedIcon}
                role="img"
                aria-label={i18n.t('Grouped into ranges')}
                data-test="layout-chip-grouped-icon"
            >
                <IconGroupedRanges />
            </span>
        )}
    </button>
)
