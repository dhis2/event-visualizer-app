import i18n from '@dhis2/d2-i18n'
import { type FC, useMemo } from 'react'
import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import { useSelectedDimensionCount } from '@components/main-sidebar/dimension-cards-provider'
import { createEventWithoutRegistrationMatchFn } from '@components/main-sidebar/dimension-cards-provider/matcher-functions'
import { getEventFixedDimensions } from '@components/main-sidebar/fixed-dimensions'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import { getDataElementQuery } from '@components/main-sidebar/use-dimension-list/query-helpers'
import { useCurrentUser } from '@hooks'
import type {
    DataSourceProgramWithoutRegistration,
    DimensionType,
    ProgramStage,
} from '@types'

type CardEventProps = {
    program: DataSourceProgramWithoutRegistration
}
const CARD_AND_LIST_KEY = 'event-without-registration'

export const CardEvent: FC<CardEventProps> = ({ program }) => {
    const {
        settings: { displayNameProperty },
    } = useCurrentUser()
    const programStage = useMemo<ProgramStage>(() => {
        const programStage = program.programStages?.[0]

        if (!programStage) {
            throw new Error(`No programStage found for program "${program.id}"`)
        }

        return programStage
    }, [program])
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
    const isSelectedMatchFn = useMemo(
        () =>
            createEventWithoutRegistrationMatchFn(
                programStage.id,
                dimensionTypeLookup
            ),
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
