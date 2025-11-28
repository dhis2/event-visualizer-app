import type { FC } from 'react'
import classes from './styles/sections.module.css'
import { DigitGroupSeparator } from '@components/options/fields/digit-group-separator'
import { DisplayDensity } from '@components/options/fields/display-density'
import { FontSize } from '@components/options/fields/font-size'
import { ShowHierarchy } from '@components/options/fields/show-hierarchy'

export const LineListStyleSection: FC = () => (
    <div className={classes.section} data-test="line-list-style-section">
        <DisplayDensity />
        <FontSize />
        <DigitGroupSeparator />
        <ShowHierarchy />
    </div>
)
