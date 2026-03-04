import i18n from '@dhis2/d2-i18n'
import { type FC, useMemo } from 'react'
import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import { getEventFixedDimensions } from '@components/main-sidebar/get-event-fixed-dimensions'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import { getDataElementQuery } from '@components/main-sidebar/use-dimension-list/query-helpers'
import { useCurrentUser } from '@hooks'
import type { DataSourceProgramWithoutRegistration, ProgramStage } from '@types'

type CardEventProps = {
    program: DataSourceProgramWithoutRegistration
}
const CARD_AND_LIST_KEY = 'event-without-registration'

export const CardEvent: FC<CardEventProps> = ({ program }: CardEventProps) => {
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
    const baseQuery = useMemo(
        () => getDataElementQuery(programStage.id, displayNameProperty),
        [programStage.id, displayNameProperty]
    )
    const listProps = useDimensionList({
        dimensionListKey: CARD_AND_LIST_KEY,
        fixedDimensions,
        baseQuery,
    })

    return (
        <DimensionCard
            dimensionCardKey={CARD_AND_LIST_KEY}
            title={program.displayEventLabel ?? i18n.t('Event')}
            isDisabledByFilter={listProps.isDisabledByFilter}
        >
            <DimensionList
                {...listProps}
                program={program}
                programStage={programStage}
            />
        </DimensionCard>
    )
}
