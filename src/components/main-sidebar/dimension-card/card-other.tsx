import i18n from '@dhis2/d2-i18n'
import type { FC } from 'react'
import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import type { SingleQuery } from '@types'

const CARD_AND_LIST_KEY = 'other'
const BASE_QUERY: SingleQuery = {
    resource: 'dimensions',
    params: {
        pageSize: 10,
        fields: 'id,dimensionType,valueType,optionSet,displayName~rename(name)',
        filter: 'dimensionType:eq:ORGANISATION_UNIT_GROUP_SET',
        order: 'displayName:asc',
    },
}

export const CardOther: FC = () => {
    const listProps = useDimensionList({
        dimensionListKey: CARD_AND_LIST_KEY,
        baseQuery: BASE_QUERY,
    })

    if (listProps.dimensions.length === 0) {
        return null
    }

    return (
        <DimensionCard
            dimensionCardKey={CARD_AND_LIST_KEY}
            title={i18n.t('Other')}
            isDisabledByFilter={listProps.isDisabledByFilter}
        >
            <DimensionList {...listProps} />
        </DimensionCard>
    )
}
