import cx from 'classnames'
import React from 'react'
import { DimensionIcon } from './dimension-icon'
import styles from './styles/dimension-item-base.module.css'
import type { SupportedDimensionType } from '@constants/dimension-types'

interface DimensionItemBaseProps {
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

const DimensionItemBase: React.FC<DimensionItemBaseProps> = ({
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
        className={cx(styles.dimensionItemBase, {
            [styles.selected]: selected,
            [styles.disabled]: disabled,
            [styles.dragging]: dragging,
        })}
        onClick={onClick}
        data-test={`dimension-item-base-${name.replace(/\s+/g, '-')}`}
    >
        <div className={styles.iconAndLabelWrapper}>
            <div className={styles.icon}>
                <DimensionIcon dimensionType={dimensionType} />
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
                data-test={`item-menu-button-${name.replace(/\s+/g, '-')}`}
            >
                {menuButton}
            </div>
        )}
    </div>
)

export { DimensionItemBase }
