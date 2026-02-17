import type { FC } from 'react'
import classes from './styles/skeleton-chip.module.css'

export const SkeletonChip: FC<{
    dataTest?: string
    width?: string | number
}> = ({ dataTest, width }) => (
    <div
        data-test={dataTest ?? 'skeleton-chip'}
        className={classes.skeletonChip}
        style={{
            width: typeof width === 'number' ? `${width}px` : width ?? '100%',
        }}
    />
)
