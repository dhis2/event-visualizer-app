import i18n from '@dhis2/d2-i18n'
import { DataTableCell, Tooltip } from '@dhis2/ui'
import cx from 'classnames'
import classes from './styles/body-cell.module.css'
import type { LineListCellData } from './types'

type BodyCellProps = LineListCellData & {
    fontSizeClass: string
    sizeClass: string
}

const BodyCell = ({
    fontSizeClass,
    formattedValue,
    sizeClass,
    value,
    backgroundColor,
    isUndefined,
    isUrl,
    shouldNotWrap,
    textColor,
    tooltipProps,
}: BodyCellProps & { tooltipProps?: object }) => (
    <DataTableCell
        {...tooltipProps}
        className={cx(
            classes.cell,
            fontSizeClass,
            sizeClass,
            {
                [classes.emptyCell]: !value,
                [classes.nowrap]: shouldNotWrap,
                [classes.undefinedCell]: isUndefined,
            },
            'bordered'
        )}
        backgroundColor={backgroundColor}
        dataTest="table-cell"
    >
        <div style={textColor ? { color: textColor } : undefined}>
            {isUrl ? (
                <a href={value} target="_blank" rel="noreferrer">
                    {value}
                </a>
            ) : (
                formattedValue
            )}
        </div>
    </DataTableCell>
)

const BodyCellWithConditionalTooltip = (props: BodyCellProps) => {
    if (!props.isUndefined) {
        return <BodyCell {...props} />
    }

    return (
        <Tooltip content={i18n.t('No event')}>
            {(tooltipProps) => (
                <BodyCell {...props} tooltipProps={tooltipProps} />
            )}
        </Tooltip>
    )
}

export { BodyCellWithConditionalTooltip as BodyCell }
