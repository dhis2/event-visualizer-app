import { IconTableRows } from '@components/layout-panel/bottom-bar/icon-table-rows'
import { CellValueModal } from '@components/layout-panel/cell-value-modal'
import i18n from '@dhis2/d2-i18n'
import { IconEdit16, Tooltip } from '@dhis2/ui'
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

const TOOLTIP_OPEN_DELAY = 500

/* The item list in the modal is fetched for a single program, so a layout
 * without exactly one program has no unambiguous set of values to choose from. */
const useUnavailableReason = (): string | undefined => {
    const { programIds } = useLayoutContext()

    if (programIds.length === 0) {
        return i18n.t('Not valid without a program')
    }
    if (programIds.length > 1) {
        return i18n.t('Not valid with multiple programs')
    }
    return undefined
}

export const CellValueButton: FC = () => {
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const outputTypeLabel = useOutputTypeLabel(outputType)
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const customValueMetadata = useMetadataItem(customValue?.id)
    const unavailableReason = useUnavailableReason()
    const [isModalOpen, setIsModalOpen] = useState(false)

    const onClick = useCallback(() => setIsModalOpen(true), [])
    const onModalClose = useCallback(() => setIsModalOpen(false), [])

    const label = customValueMetadata?.name
        ? i18n.t('Cells show {{- valueName}}', {
              valueName: customValueMetadata.name,
              nsSeparator: '^^',
          })
        : i18n.t('Cells show {{- outputTypeLabel}} count', {
              outputTypeLabel,
              nsSeparator: '^^',
          })

    const button = (
        <button
            type="button"
            onClick={onClick}
            disabled={Boolean(unavailableReason)}
            data-test="cell-value-button"
            className={cx(classes.button, {
                [classes.disabled]: Boolean(unavailableReason),
            })}
        >
            <IconTableRows />
            {label}
            <IconEdit16 />
        </button>
    )

    return (
        <>
            {unavailableReason ? (
                <Tooltip
                    content={unavailableReason}
                    openDelay={TOOLTIP_OPEN_DELAY}
                >
                    {(tooltipProps: object) => (
                        <span
                            className={classes.tooltipWrapper}
                            {...tooltipProps}
                        >
                            {button}
                        </span>
                    )}
                </Tooltip>
            ) : (
                button
            )}
            {isModalOpen && <CellValueModal onClose={onModalClose} />}
        </>
    )
}
