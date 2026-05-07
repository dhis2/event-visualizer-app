import i18n from '@dhis2/d2-i18n'
import { IconSync16 } from '@dhis2/ui'
import { useAppSelector, useProgramStageMetadataItem } from '@hooks'
import { getDimensionIdParts } from '@modules/dimension.js'
import {
    DEFAULT_REPETITIONS_OBJECT,
    getVisUiConfigRepetitionsByDimension,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice.js'
import type { DimensionMetadataItem /*, ValueType */ } from '@types'
import { type FC } from 'react'
import { ConditionsSection } from './conditions-section'
import { ConditionsTabContent } from './conditions-tab-content'
import { LegendSetSelection } from './legend-set-selection/legend-set-selection'
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

    const canConfigureRepeatedEvents: boolean =
        visType === 'LINE_LIST' &&
        dimension.dimensionType === 'DATA_ELEMENT' &&
        Boolean(stage?.repeatable)
    const repetitions = useAppSelector((state) =>
        getVisUiConfigRepetitionsByDimension(state, dimension.id)
    )
    const isRepeatedEventsConfigured =
        repetitions.mostRecent !== DEFAULT_REPETITIONS_OBJECT.mostRecent ||
        repetitions.oldest !== DEFAULT_REPETITIONS_OBJECT.oldest

    return (
        <div className={classes.sectionStack}>
            <LegendSetSelection dimension={dimension} />
            <ConditionsTabContent dimension={dimension} />
            {canConfigureRepeatedEvents && (
                <ConditionsSection
                    title={i18n.t('Repeated events')}
                    titleIcon={<IconSync16 />}
                    collapsible
                    defaultExpanded={isRepeatedEventsConfigured}
                    dataTest="dimension-popover-repeated-events-section"
                >
                    <RepeatedEventsTabContent dimensionId={dimension.id} />
                </ConditionsSection>
            )}
        </div>
    )
}
