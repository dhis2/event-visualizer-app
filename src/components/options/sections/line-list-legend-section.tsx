import { type FC } from 'react'
import classes from './styles/sections.module.css'
import { Legend } from '@components/options/fields/legend'

export const LineListLegendSection: FC = () => (
    <div className={classes.section} data-test="line-list-legend-section">
        <Legend />
    </div>
)
