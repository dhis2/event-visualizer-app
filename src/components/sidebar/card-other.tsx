import {
    DimensionCard,
    DimensionList,
} from '@components/sidebar/dimension-card'
import { useDimensionList } from '@components/sidebar/use-dimension-list'
import { getOtherDimensionsQuery } from '@components/sidebar/use-dimension-list/query-helpers'
import {
    useSelectedDimensionCount,
    type UseSelectedDimensionCountMatchFn,
} from '@components/sidebar/use-selected-dimension-count'
import i18n from '@dhis2/d2-i18n'
import { useCurrentUser } from '@hooks'
import type { SingleQuery } from '@types'
import { type FC, useMemo } from 'react'

const CARD_AND_LIST_KEY = 'other'

const isSelectedMatchFn: UseSelectedDimensionCountMatchFn = (
    selectedDimension
) => selectedDimension.dimensionType === 'ORGANISATION_UNIT_GROUP_SET'

export const CardOther: FC = () => {
    const {
        settings: { displayNameProperty },
    } = useCurrentUser()
    const baseQuery = useMemo<SingleQuery>(
        () => getOtherDimensionsQuery(displayNameProperty),
        [displayNameProperty]
    )
    const listProps = useDimensionList({
        dimensionListKey: CARD_AND_LIST_KEY,
        baseQuery,
    })
    const selectedCount = useSelectedDimensionCount(isSelectedMatchFn)

    if (listProps.dimensions.length === 0) {
        return null
    }

    return (
        <DimensionCard
            dimensionCardKey={CARD_AND_LIST_KEY}
            title={i18n.t('Other')}
            isDisabledByFilter={listProps.isDisabledByFilter}
            selectedCount={selectedCount}
        >
            <DimensionList {...listProps} />
        </DimensionCard>
    )
}
