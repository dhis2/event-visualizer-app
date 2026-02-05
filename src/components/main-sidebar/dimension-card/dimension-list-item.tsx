import classes from './styles/dimension-list-item.module.css'
import type { DimensionMetadataItem } from '@types'

type DimensionListItemProps = {
    dimension?: DimensionMetadataItem
}

export const DimensionListItem = ({ dimension }: DimensionListItemProps) => {
    return (
        <div className={classes.item} data-test="dimension-list-item">
            {dimension?.name ?? 'TEMP PLACEHOLDER'}
        </div>
    )
}
