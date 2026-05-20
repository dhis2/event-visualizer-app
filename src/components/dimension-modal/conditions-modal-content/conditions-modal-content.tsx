import { Section } from '@components/dimension-modal/section'
import i18n from '@dhis2/d2-i18n'
import { IconFilter16, IconSync16 } from '@dhis2/ui'
import { useAppSelector, useProgramStageMetadataItem } from '@hooks'
import { getDimensionIdParts } from '@modules/dimension.js'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice.js'
import type { DimensionMetadataItem } from '@types'
import { type FC } from 'react'
import { ConditionsTabContent } from './conditions-tab-content'
import { RepeatedEventsTabContent } from './repeated-events-tab-content'
import classes from './styles/conditions-modal-content.module.css'

type ConditionsModalContentProps = {
    dimension: DimensionMetadataItem
}

export const ConditionsModalContent: FC<ConditionsModalContentProps> = ({
    dimension,
}) => {
    const visType = useAppSelector(getVisUiConfigVisualizationType)

    const stage = useProgramStageMetadataItem(
        getDimensionIdParts({ id: dimension.id }).programStageId
    )

    const showRepeatedEvents =
        visType === 'LINE_LIST' &&
        dimension.dimensionType === 'DATA_ELEMENT' &&
        Boolean(stage?.repeatable)

    return (
        <div className={classes.sectionsContainer}>
            <Section icon={<IconFilter16 />} title={i18n.t('Data')}>
                <ConditionsTabContent dimension={dimension} />
            </Section>
            {showRepeatedEvents && (
                <Section
                    icon={<IconSync16 />}
                    title={i18n.t('Repeated events')}
                    topBorder
                >
                    <RepeatedEventsTabContent dimensionId={dimension.id} />
                </Section>
            )}
        </div>
    )
}
