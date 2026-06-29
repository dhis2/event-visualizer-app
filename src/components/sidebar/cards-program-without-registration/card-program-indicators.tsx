import {
    DimensionCard,
    DimensionList,
} from '@components/sidebar/dimension-card'
import { useDimensionList } from '@components/sidebar/use-dimension-list'
import { getEventProgramIndicatorQuery } from '@components/sidebar/use-dimension-list/query-helpers'
import {
    useSelectedDimensionCount,
    type UseSelectedDimensionCountMatchFn,
} from '@components/sidebar/use-selected-dimension-count'
import i18n from '@dhis2/d2-i18n'
import { useCurrentUser } from '@hooks'
import type { Program } from '@types'
import { useCallback, useMemo, type FC } from 'react'

type CardProgramIndicatorsProps = {
    program: Program
}

const CARD_AND_LIST_KEY = 'event-program-indicators'

export const CardProgramIndicators: FC<CardProgramIndicatorsProps> = ({
    program,
}) => {
    const {
        settings: { displayNameProperty },
    } = useCurrentUser()

    const baseQuery = useMemo(
        () => getEventProgramIndicatorQuery(program.id, displayNameProperty),
        [program.id, displayNameProperty]
    )
    const listProps = useDimensionList({
        dimensionListKey: CARD_AND_LIST_KEY,
        baseQuery,
    })
    const isSelectedMatchFn: UseSelectedDimensionCountMatchFn = useCallback(
        (dimension) =>
            dimension.dimensionType === 'PROGRAM_INDICATOR' &&
            dimension.programId === program.id,
        [program.id]
    )
    const selectedCount = useSelectedDimensionCount(isSelectedMatchFn)

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
