import type { ReactNode } from 'react'
import classes from './styles/dimension-list.module.css'

type DimensionListProps = {
    children: ReactNode
}

export const DimensionList = ({ children }: DimensionListProps) => {
    return (
        <ul className={classes.list} data-test="dimension-list">
            {children}
        </ul>
    )
}
