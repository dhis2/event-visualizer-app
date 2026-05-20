import {
    DimensionCard,
    DimensionList,
} from '@components/sidebar/dimension-card'
import { getEventFixedDimensions } from '@components/sidebar/get-event-fixed-dimensions'
import { useDimensionList } from '@components/sidebar/use-dimension-list'
import { getDataElementQuery } from '@components/sidebar/use-dimension-list/query-helpers'
import {
    useSelectedDimensionCount,
    type UseSelectedDimensionCountMatchFn,
} from '@components/sidebar/use-selected-dimension-count'
import i18n from '@dhis2/d2-i18n'
import { useCurrentUser } from '@hooks'
import type {
    DataSourceProgramWithoutRegistration,
    DimensionType,
    ProgramStage,
} from '@types'
import { type FC, useCallback, useMemo } from 'react'

type CardEventProps = {
    program: DataSourceProgramWithoutRegistration
}
const CARD_AND_LIST_KEY = 'event-without-registration'

export const getProgramStage = (
    program: DataSourceProgramWithoutRegistration
): ProgramStage => {
    const programStage = program.programStages?.[0]

    if (!programStage) {
        throw new Error(`No programStage found for program "${program.id}"`)
    }

    return programStage
}

export const CardEvent: FC<CardEventProps> = ({ program }) => {
    const {
        settings: { displayNameProperty },
    } = useCurrentUser()
    const programStage = useMemo<ProgramStage>(
        () => getProgramStage(program),
        [program]
    )
    const fixedDimensions = useMemo(
        () => getEventFixedDimensions(program, programStage),
        [program, programStage]
    )
    const dimensionTypeLookup = useMemo(
        () =>
            new Set<DimensionType>(
                fixedDimensions.map((dimension) => dimension.dimensionType)
            ).add('DATA_ELEMENT'),
        [fixedDimensions]
    )
    const baseQuery = useMemo(
        () => getDataElementQuery(programStage.id, displayNameProperty),
        [programStage.id, displayNameProperty]
    )
    const listProps = useDimensionList({
        dimensionListKey: CARD_AND_LIST_KEY,
        fixedDimensions,
        baseQuery,
    })
    const isSelectedMatchFn: UseSelectedDimensionCountMatchFn = useCallback(
        (dimension) =>
            dimensionTypeLookup.has(dimension.dimensionType) &&
            dimension.programStageId === programStage.id,
        [dimensionTypeLookup, programStage.id]
    )
    const selectedCount = useSelectedDimensionCount(isSelectedMatchFn)

    return (
        <DimensionCard
            dimensionCardKey={CARD_AND_LIST_KEY}
            title={program.displayEventLabel ?? i18n.t('Event')}
            isDisabledByFilter={listProps.isDisabledByFilter}
            selectedCount={selectedCount}
        >
            <DimensionList
                {...listProps}
                program={program}
                programStage={programStage}
            />
        </DimensionCard>
    )
}
