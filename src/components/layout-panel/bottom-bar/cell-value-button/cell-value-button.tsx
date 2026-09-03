import { IconTableRows } from '@components/layout-panel/bottom-bar/icon-table-rows'
import { getProgramCountTooltipConfig } from '@components/layout-panel/bottom-bar/program-count-tooltip-config'
import { WithTooltip } from '@components/layout-panel/bottom-bar/with-tooltip'
import { CellValueModal } from '@components/layout-panel/cell-value-modal'
import i18n from '@dhis2/d2-i18n'
import { IconEdit16 } from '@dhis2/ui'
import {
    useAppSelector,
    useLayoutContext,
    useMetadataItem,
    useOutputTypeLabel,
} from '@hooks'
import {
    getVisUiConfigCustomValue,
    getVisUiConfigOutputType,
} from '@store/vis-ui-config-slice'
import cx from 'classnames'
import { useCallback, useState, type FC } from 'react'
import classes from './styles/cell-value-button.module.css'

export const CellValueButton: FC = () => {
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const outputTypeLabel = useOutputTypeLabel(outputType)
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const customValueMetadata = useMetadataItem(customValue?.id)
    const { programIds } = useLayoutContext()
    /* The item list in the modal is fetched for a single program, so a layout
     * without exactly one has no unambiguous set of values to choose from. */
    const tooltipConfig = getProgramCountTooltipConfig(programIds)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const onClick = useCallback(() => setIsModalOpen(true), [])
    const onModalClose = useCallback(() => setIsModalOpen(false), [])

    const customValueName = customValueMetadata?.name
    const label = customValueName
        ? i18n.t('Cells show {{- valueName}}', {
              valueName: customValueName,
              nsSeparator: '^^',
          })
        : i18n.t('Cells show {{- outputTypeLabel}} count', {
              outputTypeLabel,
              nsSeparator: '^^',
          })

    return (
        <>
            <WithTooltip tooltipConfig={tooltipConfig}>
                <button
                    type="button"
                    onClick={onClick}
                    disabled={Boolean(tooltipConfig)}
                    data-test="cell-value-button"
                    className={cx(classes.button, {
                        [classes.hasCustomValue]: Boolean(customValueName),
                    })}
                >
                    <IconTableRows />
                    {label}
                    <IconEdit16 />
                </button>
            </WithTooltip>
            {isModalOpen && <CellValueModal onClose={onModalClose} />}
        </>
    )
}
