import i18n from '@dhis2/d2-i18n'
import { type FC, useMemo } from 'react'
import { ProgramStageSubsection } from './program-stage-subsection'
import { DimensionCard } from '@components/main-sidebar/dimension-card'
import { EVENT_WITH_REGISTRATION_FIXED_DIMENSION_TYPES } from '@components/main-sidebar/get-event-fixed-dimensions'
import { computeIsDisabledByFilter } from '@components/main-sidebar/use-dimension-list'
import { useAppSelector } from '@hooks'
import { getFilter } from '@store/dimensions-selection-slice'
import type { DataSourceProgramWithRegistration } from '@types'

type CardEventProps = {
    program: DataSourceProgramWithRegistration
}

export const STAGE_QUERY_WITHOUT_STAGE_ID = {
    resource: 'analytics/events/query/dimensions',
    params: {
        pageSize: 10,
        fields: 'id,dimensionType,valueType,optionSet,displayName~rename(name)',
        filter: 'dimensionType:eq:DATA_ELEMENT',
        order: 'displayName:asc',
    },
}

export const CardEvent: FC<CardEventProps> = ({ program }) => {
    const filter = useAppSelector(getFilter)
    const isDisabledByFilter = useMemo(
        () =>
            computeIsDisabledByFilter(
                STAGE_QUERY_WITHOUT_STAGE_ID,
                filter,
                EVENT_WITH_REGISTRATION_FIXED_DIMENSION_TYPES
            ),
        [filter]
    )
    return (
        <DimensionCard
            dimensionCardKey="event-with-registration"
            title={program.displayEventLabel ?? i18n.t('Event data')}
            withSubSections
            isDisabledByFilter={isDisabledByFilter}
        >
            {program.programStages!.map((stage) => (
                <ProgramStageSubsection
                    program={program}
                    programStage={stage}
                    key={stage.id}
                />
            ))}
        </DimensionCard>
    )
}
