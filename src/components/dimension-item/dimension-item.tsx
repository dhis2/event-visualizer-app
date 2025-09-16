import cx from 'classnames'
import React from 'react'
import { DimensionTypeIcon } from './dimension-type-icon'
import styles from './styles/dimension-item.module.css'
import type { SupportedDimensionType } from '@types'

interface DimensionItemProps {
    name: string
    stageName?: string
    dimensionType: SupportedDimensionType
    selected?: boolean
    disabled?: boolean
    dragging?: boolean
    menuButton?: React.ReactNode
    onClick?: () => void
}

// Presentational component used by dnd - do not add redux or dnd functionality

const DimensionItem: React.FC<DimensionItemProps> = ({
    name,
    stageName,
    dimensionType,
    selected,
    disabled,
    dragging,
    menuButton,
    onClick,
}) => (
    <div
        className={cx(styles.dimensionItem, {
            [styles.selected]: selected,
            [styles.disabled]: disabled,
            [styles.dragging]: dragging,
        })}
        onClick={onClick}
        data-test={`dimension-item-${name.replace(/\s+/g, '-')}`}
    >
        <div className={styles.labelAndIconContainer}>
            <div className={styles.icon}>
                <DimensionTypeIcon dimensionType={dimensionType} />
            </div>
            <div className={styles.label}>
                <span className={styles.primary}>{name}</span>
                {stageName && (
                    <>
                        <span>, </span>
                        <span className={styles.secondary}>{stageName}</span>
                    </>
                )}
            </div>
        </div>
        {menuButton && (
            <div
                className={styles.menuButton}
                data-test={`dimension-item-button-${name.replace(/\s+/g, '-')}`}
            >
                {menuButton}
            </div>
        )}
    </div>
)

export { DimensionItem }
