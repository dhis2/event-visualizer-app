import i18n from '@dhis2/d2-i18n'
import { Tooltip } from '@dhis2/ui'
import cx from 'classnames'
import type { FC } from 'react'
import classes from './styles/body-cell.module.css'
import type { LineListCellData } from './types'

type BodyCellProps = LineListCellData

const BodyCell: FC<BodyCellProps & { tooltipProps?: object }> = ({
    formattedValue,
    value,
    backgroundColor,
    isUndefined,
    isUrl,
    shouldNotWrap,
    textColor,
    tooltipProps,
}) => (
    <td
        {...tooltipProps}
        className={cx(classes.cell, {
            [classes.emptyCell]: !value,
            [classes.nowrap]: shouldNotWrap,
            [classes.undefinedCell]: isUndefined,
        })}
        style={backgroundColor ? { backgroundColor } : undefined}
        data-test="table-cell"
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
    </td>
)

const BodyCellWithConditionalTooltip: FC<BodyCellProps> = (props) => {
    if (props.isUndefined) {
        return (
            <Tooltip content={i18n.t('No event')}>
                {(tooltipProps) => (
                    <BodyCell {...props} tooltipProps={tooltipProps} />
                )}
            </Tooltip>
        )
    }

    return <BodyCell {...props} />
}

export { BodyCellWithConditionalTooltip as BodyCell }
