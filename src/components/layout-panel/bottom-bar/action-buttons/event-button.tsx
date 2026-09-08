import i18n from '@dhis2/d2-i18n'
import { useAppSelector, useOutputTypeLabel } from '@hooks'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'
import { useMemo, type FC } from 'react'
import { BaseButtonWithConditionalTooltip } from './base-button'
import { useActionButton } from './use-action-button'

export const EventButton: FC = () => {
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)

    const { action, tooltipConfig } = useActionButton('EVENT')
    const eventLabel = useOutputTypeLabel('EVENT')

    const buttonLabelLookup = useMemo(
        () => ({
            create: {
                list: i18n.t('Create {{- eventLabel}} list', {
                    eventLabel,
                }),
                table: i18n.t('Create {{- eventLabel}} table', {
                    eventLabel,
                }),
            },
            switch: {
                list: i18n.t('Switch to {{- eventLabel}} list', {
                    eventLabel,
                }),
                table: i18n.t('Switch to {{- eventLabel}} table', {
                    eventLabel,
                }),
            },
            update: {
                list: i18n.t('Update {{- eventLabel}} list', {
                    eventLabel,
                }),
                table: i18n.t('Update {{- eventLabel}} table', {
                    eventLabel,
                }),
            },
        }),
        [eventLabel]
    )

    return (
        <BaseButtonWithConditionalTooltip
            action={action}
            dataTest="update-button-event"
            disabled={Boolean(tooltipConfig)}
            label={
                buttonLabelLookup[action][
                    visualizationType === 'PIVOT_TABLE' ? 'table' : 'list'
                ]
            }
            tooltipConfig={tooltipConfig}
            type="EVENT"
        />
    )
}
