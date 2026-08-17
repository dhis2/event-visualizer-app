import i18n from '@dhis2/d2-i18n'
import { useAppSelector, useLayoutContext, useMetadataItem } from '@hooks'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'
import { useMemo, type FC } from 'react'
import { BaseButtonWithConditionalTooltip } from './base-button'
import { useActionButton } from './use-action-button'
import { useValueFooter } from './use-value-footer'

export const TrackedEntityInstanceButton: FC = () => {
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const { action, tooltipConfig } = useActionButton('TRACKED_ENTITY_INSTANCE')
    const { valueFooter, valueModal } = useValueFooter({
        outputType: 'TRACKED_ENTITY_INSTANCE',
        action,
    })
    const { tetId } = useLayoutContext()
    const tetMetadata = useMetadataItem(tetId)

    const trackedEntityTypeName = useMemo(
        () => tetMetadata?.name ?? i18n.t('tracked entity'),
        [tetMetadata]
    )

    const buttonLabelLookup = useMemo(
        () => ({
            create: {
                list: i18n.t('Create {{- trackedEntityTypeName}} list', {
                    trackedEntityTypeName,
                }),
                table: i18n.t('Create {{- trackedEntityTypeName}} table', {
                    trackedEntityTypeName,
                }),
            },
            switch: {
                list: i18n.t('Switch to {{- trackedEntityTypeName}} list', {
                    trackedEntityTypeName,
                }),
                table: i18n.t('Switch to {{- trackedEntityTypeName}} table', {
                    trackedEntityTypeName,
                }),
            },
            update: {
                list: i18n.t('Update {{- trackedEntityTypeName}} list', {
                    trackedEntityTypeName,
                }),
                table: i18n.t('Update {{- trackedEntityTypeName}} table', {
                    trackedEntityTypeName,
                }),
            },
        }),
        [trackedEntityTypeName]
    )

    return (
        <>
            <BaseButtonWithConditionalTooltip
                action={action}
                dataTest="update-button-tracked-entity"
                disabled={Boolean(tooltipConfig)}
                label={
                    buttonLabelLookup[action][
                        visualizationType === 'PIVOT_TABLE' ? 'table' : 'list'
                    ]
                }
                tooltipConfig={tooltipConfig}
                type="TRACKED_ENTITY_INSTANCE"
                valueFooter={valueFooter}
            />
            {valueModal}
        </>
    )
}
