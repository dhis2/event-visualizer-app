import i18n from '@dhis2/d2-i18n'
import { IconFilter16 } from '@dhis2/ui'
import { type FC } from 'react'
import classes from './styles/data-section-toggle.module.css'

export type DataSectionToggleMode = 'all' | 'filter'

type DataSectionToggleProps = {
    mode: DataSectionToggleMode
    onChange: (mode: DataSectionToggleMode) => void
    dataTest?: string
}

const buttonClassName = (
    mode: DataSectionToggleMode,
    target: DataSectionToggleMode
): string =>
    mode === target
        ? `${classes.toggleButton} ${classes.toggleButtonSelected}`
        : classes.toggleButton

export const DataSectionToggle: FC<DataSectionToggleProps> = ({
    mode,
    onChange,
    dataTest,
}) => (
    <div className={classes.toggle} role="radiogroup" data-test={dataTest}>
        <button
            type="button"
            role="radio"
            aria-checked={mode === 'all'}
            className={buttonClassName(mode, 'all')}
            onClick={() => onChange('all')}
            data-test={dataTest ? `${dataTest}-show-all` : undefined}
        >
            <span className={classes.infinityGlyph} aria-hidden>
                {'∞'}
            </span>
            {i18n.t('Show all values')}
        </button>
        <button
            type="button"
            role="radio"
            aria-checked={mode === 'filter'}
            className={buttonClassName(mode, 'filter')}
            onClick={() => onChange('filter')}
            data-test={dataTest ? `${dataTest}-filter-by` : undefined}
        >
            <span className={classes.toggleIcon} aria-hidden>
                <IconFilter16 />
            </span>
            {i18n.t('Filter by…')}
        </button>
    </div>
)
