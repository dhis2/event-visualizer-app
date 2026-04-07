import cx from 'classnames'
import { type FC } from 'react'
import styles from './styles/dimension-item.module.css'
import { DimensionTypeIcon } from '@components/shared/dimension-type-icon'
import type { DimensionType } from '@types'

interface DimensionItemProps {
    name: string
    dimensionType: DimensionType
    selected?: boolean
    disabled?: boolean
    onClick: () => void
}

export const DimensionItem: FC<DimensionItemProps> = ({
    name,
    dimensionType,
    selected,
    disabled,
    onClick,
}) => (
    <button
        type="button"
        className={cx(styles.dimensionItem, {
            [styles.selected]: selected,
        })}
        disabled={disabled}
        onClick={(e) => {
            e.stopPropagation()
            onClick()
        }}
        data-test="dimension-item"
    >
        <span className={styles.icon}>
            <DimensionTypeIcon dimensionType={dimensionType} />
        </span>
        <span className={styles.label}>{name}</span>
    </button>
)
