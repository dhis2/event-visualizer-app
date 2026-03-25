import i18n from '@dhis2/d2-i18n'
import { useMemo, type FC } from 'react'
import { BaseButtonWithConditionalTooltip } from './base-button'
import { useActionButton } from './use-action-button'
import {
    isDataSourceProgramWithRegistration,
    isDataSourceTrackedEntityType,
} from '@modules/data-source'

export const TrackedEntityInstanceButton: FC = () => {
    const { action, dataSourceMetadata, tooltipConfig } = useActionButton(
        'TRACKED_ENTITY_INSTANCE'
    )

    const trackedEntityTypeName = useMemo(() => {
        if (isDataSourceProgramWithRegistration(dataSourceMetadata)) {
            return dataSourceMetadata.trackedEntityType.name
        } else if (isDataSourceTrackedEntityType(dataSourceMetadata)) {
            return dataSourceMetadata.name
        } else {
            return i18n.t('tracked entity')
        }
    }, [dataSourceMetadata])

    const buttonLabelLookup = useMemo(
        () => ({
            create: {
                list: i18n.t('Create {{trackedEntityTypeName}} list', {
                    trackedEntityTypeName,
                }),
            },
            switch: {
                list: i18n.t('Switch to {{trackedEntityTypeName}} list', {
                    trackedEntityTypeName,
                }),
            },
            update: {
                list: i18n.t('Update {{trackedEntityTypeName}} list', {
                    trackedEntityTypeName,
                }),
            },
        }),
        [trackedEntityTypeName]
    )

    return (
        <BaseButtonWithConditionalTooltip
            action={action}
            disabled={Boolean(tooltipConfig)}
            label={buttonLabelLookup[action]['list']}
            tooltipConfig={tooltipConfig}
            type="TRACKED_ENTITY_INSTANCE"
        />
    )
}
