import i18n from '@dhis2/d2-i18n'
import { type FC, useMemo } from 'react'
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

export const getFixedDimensions = (
    trackedEntityType: MetadataItem
): DimensionMetadataItem[] => {
    return [
        {
            id: `${trackedEntityType.id}.ou`,
            dimensionId: 'ou',
            dimensionType: 'ORGANISATION_UNIT',
            name: i18n.t('Registration org. unit'),
            valueType: 'ORGANISATION_UNIT',
        },
        {
            id: `${trackedEntityType.id}.created`,
            dimensionId: 'created',
            dimensionType: 'PERIOD',
            name: i18n.t('Registration date'),
            valueType: 'DATE',
        },
    ]
}

export const createIsSelectedMatchFn =
    (
        trackedEntityTypeId: string,
        fixedDimensionIdLookup: Set<string>
    ): UseSelectedDimensionCountMatchFn =>
    (dimension) => {
        if (
            dimension.trackedEntityTypeId === trackedEntityTypeId &&
            fixedDimensionIdLookup.has(dimension.id)
        ) {
            return true
        }
        /* TEAs fetched from the web api have plain IDs, no enrichment context,
         * they can only be identified by the absense of a program/stage */
        if (
            dimension.dimensionType === 'PROGRAM_ATTRIBUTE' &&
            !dimension.programId &&
            !dimension.programStageId
        ) {
            return true
        }
        return false
    }

export const CardType: FC<CardTypeProps> = ({ trackedEntityType }) => {
    const title = i18n.t('{{name}} registration', {
        name: trackedEntityType.name,
    })
    const fixedDimensions = useMemo(
        () => getFixedDimensions(trackedEntityType),
        [trackedEntityType]
    )
    const fixedDimensionIdLookup = useMemo(
        () =>
            new Set(
                getFixedDimensions(trackedEntityType).map(
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
            createIsSelectedMatchFn(
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
