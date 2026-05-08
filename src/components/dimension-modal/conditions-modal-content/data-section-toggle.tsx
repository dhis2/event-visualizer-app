import i18n from '@dhis2/d2-i18n'
import { IconFilter16, Tooltip } from '@dhis2/ui'
import { type FC } from 'react'
import classes from './styles/data-section-toggle.module.css'

export type DataSectionToggleMode = 'all' | 'filter'

type DataSectionToggleProps = {
    mode: DataSectionToggleMode
    onChange: (mode: DataSectionToggleMode) => void
    filterDisabled?: boolean
    filterDisabledTooltip?: string
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
    filterDisabled = false,
    filterDisabledTooltip,
    dataTest,
}) => {
    const filterButton = (
        <button
            type="button"
            role="radio"
            aria-checked={mode === 'filter'}
            aria-disabled={filterDisabled}
            disabled={filterDisabled}
            className={buttonClassName(mode, 'filter')}
            onClick={() => onChange('filter')}
            data-test={dataTest ? `${dataTest}-filter-by` : undefined}
        >
            <span className={classes.toggleIcon} aria-hidden>
                <IconFilter16 />
            </span>
            {i18n.t('Filter by…')}
        </button>
    )

    return (
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
            {filterDisabled && filterDisabledTooltip ? (
                <Tooltip
                    content={filterDisabledTooltip}
                    placement="bottom"
                    closeDelay={200}
                >
                    {({ onMouseOver, onMouseOut, ref }) => (
                        <span
                            ref={ref}
                            onMouseOver={onMouseOver}
                            onMouseOut={onMouseOut}
                            className={classes.filterTooltipWrap}
                        >
                            {filterButton}
                        </span>
                    )}
                </Tooltip>
            ) : (
                filterButton
            )}
        </div>
    )
}
