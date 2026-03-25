import i18n from '@dhis2/d2-i18n'
import { useMemo, type FC } from 'react'
import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import {
    useSelectedDimensionCount,
    type UseSelectedDimensionCountMatchFn,
} from '@components/main-sidebar/selected-dimensions-provider'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import { getProgramIndicatorQuery } from '@components/main-sidebar/use-dimension-list/query-helpers'
import { useCurrentUser } from '@hooks'
import type { DataSourceProgramWithRegistration } from '@types'

type CardProgramIndicatorsProps = {
    program: DataSourceProgramWithRegistration
}

const CARD_AND_LIST_KEY = 'program-indicators'

export const createIsSelectedMatchFn =
    (programId: string): UseSelectedDimensionCountMatchFn =>
    (dimension) =>
        dimension.dimensionType === 'PROGRAM_INDICATOR' &&
        dimension.programId === programId

export const CardProgramIndicators: FC<CardProgramIndicatorsProps> = ({
    program,
}) => {
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
    const isSelectedMatchFn = useMemo(
        () => createIsSelectedMatchFn(program.id),
        [program.id]
    )
    const selectedCount = useSelectedDimensionCount(isSelectedMatchFn)

    // This card should be hidden completely if there are no program indicators
    if (listProps.dimensions.length === 0) {
        return null
    }

    return (
        <DimensionCard
            dimensionCardKey={CARD_AND_LIST_KEY}
            title={i18n.t('Program indicators')}
            isDisabledByFilter={listProps.isDisabledByFilter}
            selectedCount={selectedCount}
        >
            <DimensionList {...listProps} program={program} />
        </DimensionCard>
    )
}
