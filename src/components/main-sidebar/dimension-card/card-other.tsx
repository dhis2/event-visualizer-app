import i18n from '@dhis2/d2-i18n'
import { type FC, useMemo } from 'react'
import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import { useSelectedDimensionCount } from '@components/main-sidebar/dimension-cards-provider'
import { otherMatchFn } from '@components/main-sidebar/dimension-cards-provider/matcher-functions'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import { getOtherDimensionsQuery } from '@components/main-sidebar/use-dimension-list/query-helpers'
import { useCurrentUser } from '@hooks'
import type { SingleQuery } from '@types'

const CARD_AND_LIST_KEY = 'other'

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
    const selectedCount = useSelectedDimensionCount(otherMatchFn)

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
