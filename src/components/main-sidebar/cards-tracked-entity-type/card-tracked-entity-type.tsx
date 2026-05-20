import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import type { Transformer } from '@components/main-sidebar/use-dimension-list'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import {
    useSelectedDimensionCount,
    type UseSelectedDimensionCountMatchFn,
} from '@components/main-sidebar/use-selected-dimension-count'
import i18n from '@dhis2/d2-i18n'
import { getTrackedEntityTypeFixedDimensions } from '@modules/dimension'
import { isObject, isPopulatedString } from '@modules/validation'
import type {
    DimensionMetadataItem,
    MetadataItem,
    SingleQuery,
    ValueType,
} from '@types'
import { useCallback, type FC, useMemo } from 'react'

type CardTrackedEntityTypeProps = {
    trackedEntityType: MetadataItem
}

const CARD_AND_LIST_KEY = 'tracked-entity-type'

const transformItem = (
    item: unknown,
    trackedEntityTypeId: string
): DimensionMetadataItem => {
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
        const attrId = item.trackedEntityAttribute.id
        return {
            id: `${trackedEntityTypeId}.${attrId}`,
            dimensionId: attrId,
            name: item.trackedEntityAttribute.name,
            valueType: item.trackedEntityAttribute.valueType as ValueType,
            dimensionType: 'PROGRAM_ATTRIBUTE',
            trackedEntityTypeId,
        }
    } else {
        throw new Error('Invalid response data item')
    }
}

const transformTrackedEntityTypeAttributes = (
    data: unknown,
    trackedEntityTypeId: string
): ReturnType<Transformer> => {
    if (
        isObject(data) &&
        'trackedEntityTypeAttributes' in data &&
        Array.isArray(data.trackedEntityTypeAttributes)
    ) {
        const dimensions = data.trackedEntityTypeAttributes.map((item) =>
            transformItem(item, trackedEntityTypeId)
        )
        return { dimensions, nextPage: null }
    } else {
        throw new Error('Invalid response data')
    }
}

export const CardTrackedEntityType: FC<CardTrackedEntityTypeProps> = ({
    trackedEntityType,
}) => {
    const title = i18n.t('{{name}} registration', {
        name: trackedEntityType.name,
    })
    const fixedDimensions = useMemo(
        () => getTrackedEntityTypeFixedDimensions(trackedEntityType),
        [trackedEntityType]
    )
    const fixedDimensionIdLookup = useMemo(
        () => new Set(fixedDimensions.map((dimension) => dimension.id)),
        [fixedDimensions]
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
    const transformer = useCallback<Transformer>(
        (data) =>
            transformTrackedEntityTypeAttributes(data, trackedEntityType.id),
        [trackedEntityType.id]
    )
    const listProps = useDimensionList({
        dimensionListKey: CARD_AND_LIST_KEY,
        baseQuery,
        fixedDimensions,
        transformer,
    })
    const isSelectedMatchFn: UseSelectedDimensionCountMatchFn = useCallback(
        (dimension) =>
            dimension.trackedEntityTypeId === trackedEntityType.id &&
            (fixedDimensionIdLookup.has(dimension.id) ||
                dimension.dimensionType === 'PROGRAM_ATTRIBUTE'),
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
