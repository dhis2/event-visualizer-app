import i18n from '@dhis2/d2-i18n'
import { Radio, Tooltip } from '@dhis2/ui'
import { type FC, type ReactNode } from 'react'
import classes from './styles/data-section-toggle.module.css'

export type DataSectionToggleMode = 'all' | 'filter'

type DataSectionToggleProps = {
    mode: DataSectionToggleMode
    onChange: (mode: DataSectionToggleMode) => void
    filterDisabled?: boolean
    filterDisabledTooltip?: string
    dataTest?: string
}

const cardClassName = (selected: boolean, disabled: boolean): string => {
    const parts = [classes.card]
    if (selected) {
        parts.push(classes.cardSelected)
    }
    if (disabled) {
        parts.push(classes.cardDisabled)
    }
    return parts.join(' ')
}

type CardProps = {
    selected: boolean
    disabled?: boolean
    onSelect: () => void
    children: ReactNode
}

const Card: FC<CardProps> = ({
    selected,
    disabled = false,
    onSelect,
    children,
}) => (
    <div
        className={cardClassName(selected, disabled)}
        onClick={disabled ? undefined : onSelect}
    >
        {children}
    </div>
)

export const DataSectionToggle: FC<DataSectionToggleProps> = ({
    mode,
    onChange,
    filterDisabled = false,
    filterDisabledTooltip,
    dataTest,
}) => {
    const filterCard = (
        <Card
            selected={mode === 'filter'}
            disabled={filterDisabled}
            onSelect={() => onChange('filter')}
        >
            <Radio
                dense
                name="data-section-toggle"
                value="filter"
                label={i18n.t('Filter by…')}
                checked={mode === 'filter'}
                disabled={filterDisabled}
                onChange={() => onChange('filter')}
                dataTest={dataTest ? `${dataTest}-filter-by` : undefined}
            />
        </Card>
    )

    return (
        <div className={classes.toggle} role="radiogroup" data-test={dataTest}>
            <Card selected={mode === 'all'} onSelect={() => onChange('all')}>
                <Radio
                    dense
                    name="data-section-toggle"
                    value="all"
                    label={i18n.t('Show all values')}
                    checked={mode === 'all'}
                    onChange={() => onChange('all')}
                    dataTest={dataTest ? `${dataTest}-show-all` : undefined}
                />
            </Card>
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
                            {filterCard}
                        </span>
                    )}
                </Tooltip>
            ) : (
                filterCard
            )}
        </div>
    )
}
