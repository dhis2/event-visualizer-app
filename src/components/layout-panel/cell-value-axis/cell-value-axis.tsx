import axisClasses from '@components/layout-panel/axis/styles/axis.module.css'
import { getProgramCountTooltipConfig } from '@components/layout-panel/bottom-bar/program-count-tooltip-config'
import { WithTooltip } from '@components/layout-panel/bottom-bar/with-tooltip'
import { CellValueModal } from '@components/layout-panel/cell-value-modal'
import { aggregationTypeDisplayNames } from '@constants/aggregation-types'
import i18n from '@dhis2/d2-i18n'
import { IconEdit16 } from '@dhis2/ui'
import { useAppSelector, useLayoutContext, useMetadataItem } from '@hooks'
import { getVisUiConfigCellValue } from '@store/vis-ui-config-slice'
import cx from 'classnames'
import { useCallback, useState, type FC } from 'react'
import classes from './styles/cell-value-axis.module.css'

export const CellValueAxis: FC = () => {
    const cellValue = useAppSelector(getVisUiConfigCellValue)
    const cellValueMetadata = useMetadataItem(cellValue?.id)
    const { programIds } = useLayoutContext()
    /* The item list in the modal is fetched for a single program, so a layout
     * without exactly one has no unambiguous set of values to choose from. */
    const tooltipConfig = getProgramCountTooltipConfig(programIds)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const onClick = useCallback(() => setIsModalOpen(true), [])
    const onModalClose = useCallback(() => setIsModalOpen(false), [])

    /* A cell value whose metadata never arrived still has to render something,
     * so the raw id stands in for the name. */
    const name = cellValue && (cellValueMetadata?.name ?? cellValue.id)

    return (
        <>
            <div
                className={cx(axisClasses.container, classes.axis)}
                data-test="axis-value"
            >
                <div className={axisClasses.label}>{i18n.t('Value')}</div>
                <WithTooltip tooltipConfig={tooltipConfig}>
                    <button
                        type="button"
                        onClick={onClick}
                        disabled={Boolean(tooltipConfig)}
                        aria-haspopup="dialog"
                        data-test="axis-content-value"
                        className={cx(classes.trigger, {
                            [classes.hasCellValue]: Boolean(cellValue),
                        })}
                    >
                        <span
                            className={classes.text}
                            data-test="cell-value-label"
                        >
                            {cellValue ? (
                                <>
                                    <span>{name}</span>
                                    <span className={classes.aggregationType}>
                                        {`· ${
                                            aggregationTypeDisplayNames[
                                                cellValue.aggregationType
                                            ]
                                        }`}
                                    </span>
                                </>
                            ) : (
                                i18n.t('Count')
                            )}
                        </span>
                        <IconEdit16 />
                    </button>
                </WithTooltip>
            </div>
            {isModalOpen && <CellValueModal onClose={onModalClose} />}
        </>
    )
}
