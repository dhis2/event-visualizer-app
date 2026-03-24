import i18n from '@dhis2/d2-i18n'
import { type FC, useCallback, useMemo } from 'react'
import { ProgramStageSubsection } from './program-stage-subsection'
import { DimensionCard } from '@components/main-sidebar/dimension-card'
import { EVENT_WITH_REGISTRATION_FIXED_DIMENSION_TYPES } from '@components/main-sidebar/get-event-fixed-dimensions'
import { computeIsDisabledByFilter } from '@components/main-sidebar/use-dimension-list'
import { getDataElementQueryTemplate } from '@components/main-sidebar/use-dimension-list/query-helpers'
import {
    useSelectedDimensionCount,
    type UseSelectedDimensionCountMatchFn,
} from '@components/main-sidebar/use-selected-dimension-count'
import { useAppSelector, useCurrentUser } from '@hooks'
import { isPopulatedString } from '@modules/validation'
import { getFilter } from '@store/dimensions-selection-slice'
import type { DataSourceProgramWithRegistration, DimensionType } from '@types'

type CardEventProps = {
    program: DataSourceProgramWithRegistration
}

const EVENT_DIMENSION_TYPES = new Set<DimensionType>(
    EVENT_WITH_REGISTRATION_FIXED_DIMENSION_TYPES
).add('DATA_ELEMENT')

export const CardEvent: FC<CardEventProps> = ({ program }) => {
    const {
        settings: { displayNameProperty },
    } = useCurrentUser()
    const filter = useAppSelector(getFilter)
    const stageQueryWithoutStageId = useMemo(
        () => getDataElementQueryTemplate(displayNameProperty),
        [displayNameProperty]
    )
    const isDisabledByFilter = useMemo(
        () =>
            computeIsDisabledByFilter(
                stageQueryWithoutStageId,
                filter,
                EVENT_WITH_REGISTRATION_FIXED_DIMENSION_TYPES
            ),
        [stageQueryWithoutStageId, filter]
    )
    const stageIdLookup = useMemo(
        () =>
            new Set(
                program.programStages!.map((programStage) => programStage.id)
            ),
        [program.programStages]
    )
    const isSelectedMatchFn: UseSelectedDimensionCountMatchFn = useCallback(
        (dimension) =>
            EVENT_DIMENSION_TYPES.has(dimension.dimensionType) &&
            isPopulatedString(dimension.programStageId) &&
            stageIdLookup.has(dimension.programStageId),
        [stageIdLookup]
    )
    const selectedCount = useSelectedDimensionCount(isSelectedMatchFn)
    return (
        <DimensionCard
            dimensionCardKey="event-with-registration"
            title={program.displayEventLabel ?? i18n.t('Event data')}
            withSubSections
            isDisabledByFilter={isDisabledByFilter}
            selectedCount={selectedCount}
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
