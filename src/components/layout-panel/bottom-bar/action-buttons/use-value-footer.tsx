import {
    CustomValueModal,
    getStageIdFromDimensionId,
} from '@components/layout-panel/custom-value-modal'
import { aggregationTypeDisplayNames } from '@constants/aggregation-types'
import i18n from '@dhis2/d2-i18n'
import { useAppSelector, useLayoutContext, useMetadataItem } from '@hooks'
import {
    getVisUiConfigCustomValueByOutputType,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import type { OutputType } from '@types'
import { useCallback, useState } from 'react'
import type { ButtonAction, ValueFooterConfig } from './base-button'

/* The footer belongs to the button that is currently rendering the
 * visualization, and only where cells hold an aggregate — a line list shows
 * rows, so it has no cell value to change. */
export const useValueFooter = ({
    outputType,
    action,
}: {
    outputType: OutputType
    action: ButtonAction
}): { valueFooter?: ValueFooterConfig; valueModal: React.ReactNode } => {
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const customValue = useAppSelector(getVisUiConfigCustomValueByOutputType)[
        outputType
    ]
    const customValueMetadata = useMetadataItem(customValue?.id)
    const { programStageIds } = useLayoutContext()
    const [isModalOpen, setIsModalOpen] = useState(false)

    const onClick = useCallback(() => setIsModalOpen(true), [])
    const onModalClose = useCallback(() => setIsModalOpen(false), [])

    const isShown = action === 'update' && visualizationType === 'PIVOT_TABLE'

    const layoutStageId = programStageIds[0] ?? null
    const customValueStageId = getStageIdFromDimensionId(customValue?.id)
    const hasStageMismatch = Boolean(
        layoutStageId &&
        customValueStageId &&
        customValueStageId !== layoutStageId
    )

    const tooltipContent = (() => {
        if (hasStageMismatch) {
            return i18n.t(
                'This value is from a different stage than the dimensions in the layout'
            )
        }
        if (customValue) {
            return i18n.t('Aggregation: {{- aggregationType}}', {
                aggregationType:
                    aggregationTypeDisplayNames[customValue.aggregationType],
                nsSeparator: '^^',
            })
        }
        return i18n.t('Change the value shown in each cell')
    })()

    return {
        valueFooter: isShown
            ? {
                  label: customValueMetadata?.name ?? i18n.t('count'),
                  onClick,
                  tooltipContent,
              }
            : undefined,
        valueModal: isModalOpen ? (
            <CustomValueModal outputType={outputType} onClose={onModalClose} />
        ) : null,
    }
}
