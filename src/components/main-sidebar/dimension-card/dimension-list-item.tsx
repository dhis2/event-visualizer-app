import classes from './styles/dimension-list-item.module.css'
import type { DimensionMetadataItem } from '@types'

type DimensionListItemProps = {
    dimension?: DimensionMetadataItem
}

export const DimensionListItem = ({ dimension }: DimensionListItemProps) => {
    return (
        <li className={classes.item} data-test="dimension-list-item">
            {dimension?.name ?? 'TEMP PLACEHOLDER'}
        </li>
    )
}
