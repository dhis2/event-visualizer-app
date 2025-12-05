import i18n from '@dhis2/d2-i18n'
import type { FC } from 'react'
import classes from './styles/tabs.module.css'
import { DigitGroupSeparator } from '@components/options/fields/digit-group-separator'
import { DisplayDensity } from '@components/options/fields/display-density'
import { FontSize } from '@components/options/fields/font-size'
import { ShowHierarchy } from '@components/options/fields/show-hierarchy'
import { Subtitle } from '@components/options/fields/subtitle'
import { Title } from '@components/options/fields/title'
import { OptionsFieldSet } from '@components/options/options-fieldset'

export const PivotTableStyleTab: FC = () => (
    <div className={classes.tab} data-test="pivot-table-style-tab">
        <OptionsFieldSet>
            <Title label={i18n.t('Table title')} />
            <Subtitle label={i18n.t('Table subtitle')} />
            <DisplayDensity />
            <FontSize />
            <DigitGroupSeparator />
        </OptionsFieldSet>
        <OptionsFieldSet title={i18n.t('Labels')}>
            <ShowHierarchy />
        </OptionsFieldSet>
    </div>
)
