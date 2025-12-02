import { type FC } from 'react'
import classes from './styles/tabs.module.css'
import { Legend } from '@components/options/fields/legend'

export const LineListLegendTab: FC = () => (
    <div className={classes.section} data-test="line-list-legend-tab">
        <Legend />
    </div>
)
