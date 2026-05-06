import i18n from '@dhis2/d2-i18n'
import { useMetadataItem, useTetId } from '@hooks'
import { useMemo, type FC } from 'react'
import { BaseButtonWithConditionalTooltip } from './base-button'
import { useActionButton } from './use-action-button'

export const TrackedEntityInstanceButton: FC = () => {
    const { action, tooltipConfig } = useActionButton('TRACKED_ENTITY_INSTANCE')
    const tetId = useTetId()
    const tetMetadata = useMetadataItem(tetId)

    const trackedEntityTypeName = useMemo(
        () => tetMetadata?.name ?? i18n.t('tracked entity'),
        [tetMetadata]
    )

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
