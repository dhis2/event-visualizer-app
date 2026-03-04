import i18n from '@dhis2/d2-i18n'
import { useMemo } from 'react'
import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import { getProgramIndicatorQuery } from '@components/main-sidebar/use-dimension-list/query-helpers'
import { useCurrentUser } from '@hooks'
import type { DataSourceProgramWithRegistration } from '@types'

type CardProgramIndicatorsProps = {
    program: DataSourceProgramWithRegistration
}

const CARD_AND_LIST_KEY = 'program-indicators'

export const CardProgramIndicators = ({
    program,
}: CardProgramIndicatorsProps) => {
    const {
        settings: { displayNameProperty },
    } = useCurrentUser()
    const baseQuery = useMemo(
        () => getProgramIndicatorQuery(program.id, displayNameProperty),
        [program.id, displayNameProperty]
    )
    const listProps = useDimensionList({
        dimensionListKey: CARD_AND_LIST_KEY,
        baseQuery,
    })

    // This card should be hidden completely if there are no program indicators
    if (listProps.dimensions.length === 0) {
        return null
    }

    return (
        <DimensionCard
            dimensionCardKey={CARD_AND_LIST_KEY}
            title={i18n.t('Program indicators')}
            isDisabledByFilter={listProps.isDisabledByFilter}
        >
            <DimensionList {...listProps} program={program} />
        </DimensionCard>
    )
}
