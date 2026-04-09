import { Legend } from '@components/options/fields/legend'
import { OptionsFieldSet } from '@components/options/options-fieldset'
import { type FC } from 'react'
import classes from './styles/tabs.module.css'

export const LineListLegendTab: FC = () => (
    <div className={classes.tab} data-test="line-list-legend-tab">
        <OptionsFieldSet>
            <Legend />
        </OptionsFieldSet>
    </div>
)
