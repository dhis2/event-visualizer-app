import i18n from '@dhis2/d2-i18n'
import { useMemo, type FC } from 'react'
import { BaseButtonWithConditionalTooltip } from './base-button'
import { useActionButton } from './use-action-button'
import { useAppSelector } from '@hooks'
import { isDataSourceProgramWithRegistration } from '@modules/data-source'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'

export const EventButton: FC = () => {
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)

    const { action, dataSourceMetadata, tooltipConfig } =
        useActionButton('EVENT')

    const eventLabel = useMemo(() => {
        if (
            isDataSourceProgramWithRegistration(dataSourceMetadata) &&
            dataSourceMetadata.displayEventLabel
        ) {
            return dataSourceMetadata.displayEventLabel
        }

        return i18n.t('Event')
    }, [dataSourceMetadata])

    const buttonLabelLookup = useMemo(
        () => ({
            create: {
                list: i18n.t('Create {{eventLabel}} list', {
                    eventLabel,
                }),
                table: i18n.t('Create {{eventLabel}} table', {
                    eventLabel,
                }),
            },
            switch: {
                list: i18n.t('Switch to {{eventLabel}} list', {
                    eventLabel,
                }),
                table: i18n.t('Switch to {{eventLabel}} table', {
                    eventLabel,
                }),
            },
            update: {
                list: i18n.t('Update {{eventLabel}} list', {
                    eventLabel,
                }),
                table: i18n.t('Update {{eventLabel}} table', {
                    eventLabel,
                }),
            },
        }),
        [eventLabel]
    )

    return (
        <BaseButtonWithConditionalTooltip
            action={action}
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
