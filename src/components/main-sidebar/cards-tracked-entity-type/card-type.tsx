import i18n from '@dhis2/d2-i18n'
import { type FC, useMemo } from 'react'
import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import { useSelectedDimensionCount } from '@components/main-sidebar/dimension-cards-provider'
import { createTrackedEntityTypeMatchFn } from '@components/main-sidebar/dimension-cards-provider/matcher-functions'
import { getTetFixedDimensions } from '@components/main-sidebar/fixed-dimensions'
import type { Transformer } from '@components/main-sidebar/use-dimension-list'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import { isObject, isPopulatedString } from '@modules/validation'
import type {
    DimensionMetadataItem,
    MetadataItem,
    SingleQuery,
    ValueType,
} from '@types'

type CardTypeProps = {
    trackedEntityType: MetadataItem
}

const CARD_AND_LIST_KEY = 'tracked-entity-type'

const transformItem = (item: unknown): DimensionMetadataItem => {
    if (
        isObject(item) &&
        'trackedEntityAttribute' in item &&
        isObject(item.trackedEntityAttribute) &&
        'id' in item.trackedEntityAttribute &&
        'name' in item.trackedEntityAttribute &&
        'valueType' in item.trackedEntityAttribute &&
        isPopulatedString(item.trackedEntityAttribute.id) &&
        isPopulatedString(item.trackedEntityAttribute.name) &&
        isPopulatedString(item.trackedEntityAttribute.valueType)
    ) {
        return {
            id: item.trackedEntityAttribute.id,
            dimensionId: item.trackedEntityAttribute.id,
            name: item.trackedEntityAttribute.name,
            valueType: item.trackedEntityAttribute.valueType as ValueType,
            dimensionType: 'PROGRAM_ATTRIBUTE',
        }
    } else {
        throw new Error('Invalid response data item')
    }
}

const transformer: Transformer = (data) => {
    if (
        isObject(data) &&
        'trackedEntityTypeAttributes' in data &&
        Array.isArray(data.trackedEntityTypeAttributes)
    ) {
        const dimensions = data.trackedEntityTypeAttributes.map(transformItem)
        return { dimensions, nextPage: null }
    } else {
        throw new Error('Invalid response data')
    }
}

export const CardType: FC<CardTypeProps> = ({ trackedEntityType }) => {
    const title = i18n.t('{{name}} registration', {
        name: trackedEntityType.name,
    })
    const fixedDimensions = useMemo(
        () => getTetFixedDimensions(trackedEntityType),
        [trackedEntityType]
    )
    const fixedDimensionIdLookup = useMemo(
        () =>
            new Set(
                getTetFixedDimensions(trackedEntityType).map(
                    (dimension) => dimension.id
                )
            ),
        [trackedEntityType]
    )
    const baseQuery = useMemo<SingleQuery>(
        () => ({
            resource: 'trackedEntityTypes',
            id: trackedEntityType.id,
            params: {
                fields: [
                    'id',
                    'displayName~rename(name)',
                    'trackedEntityTypeAttributes[trackedEntityAttribute[id,displayName~rename(name),valueType,optionSet]]',
                ],
            },
        }),
        [trackedEntityType.id]
    )
    const listProps = useDimensionList({
        dimensionListKey: CARD_AND_LIST_KEY,
        baseQuery,
        fixedDimensions,
        transformer,
    })
    const isSelectedMatchFn = useMemo(
        () =>
            createTrackedEntityTypeMatchFn(
                trackedEntityType.id,
                fixedDimensionIdLookup
            ),
        [trackedEntityType.id, fixedDimensionIdLookup]
    )
    const selectedCount = useSelectedDimensionCount(isSelectedMatchFn)

    return (
        <DimensionCard
            dimensionCardKey={CARD_AND_LIST_KEY}
            title={title}
            isDisabledByFilter={listProps.isDisabledByFilter}
            selectedCount={selectedCount}
        >
            <DimensionList {...listProps} />
        </DimensionCard>
    )
}
