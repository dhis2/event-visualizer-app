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

type TrackedEntityAttributeResponse = Record<string, unknown> & {
    id: string
    name: string
    valueType: string
}

const CARD_AND_LIST_KEY = 'tracked-entity-type'

const getOptionalString = (value: unknown): string | undefined =>
    isPopulatedString(value) ? value : undefined

const isTrackedEntityAttributeResponse = (
    value: unknown
): value is TrackedEntityAttributeResponse =>
    isObject(value) &&
    isPopulatedString(value.id) &&
    isPopulatedString(value.name) &&
    isPopulatedString(value.valueType)

const transformItem = (
    item: unknown,
    trackedEntityTypeId: string
): DimensionMetadataItem => {
    if (
        isObject(item) &&
        'trackedEntityAttribute' in item &&
        isTrackedEntityAttributeResponse(item.trackedEntityAttribute)
    ) {
        const { trackedEntityAttribute } = item
        const { id, name, valueType } = trackedEntityAttribute
        const displayDescription = getOptionalString(
            trackedEntityAttribute.displayDescription
        )
        const description = getOptionalString(
            trackedEntityAttribute.description
        )
        const code = getOptionalString(trackedEntityAttribute.code)
        const lastUpdated = getOptionalString(
            trackedEntityAttribute.lastUpdated
        )

        return {
            id,
            dimensionId: id,
            name,
            valueType: valueType as ValueType,
            dimensionType: 'PROGRAM_ATTRIBUTE',
            trackedEntityTypeId,
            ...(displayDescription ? { displayDescription } : {}),
            ...(description ? { description } : {}),
            ...(code ? { code } : {}),
            ...(lastUpdated ? { lastUpdated } : {}),
            ...('optionSet' in trackedEntityAttribute &&
            trackedEntityAttribute.optionSet
                ? { optionSet: trackedEntityAttribute.optionSet }
                : {}),
            ...('legendSets' in trackedEntityAttribute &&
            trackedEntityAttribute.legendSets
                ? { legendSets: trackedEntityAttribute.legendSets }
                : {}),
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
                    'trackedEntityTypeAttributes[trackedEntityAttribute[id,displayName~rename(name),displayDescription,description,code,lastUpdated,valueType,optionSet[displayName,name],legendSets[id,displayName,name]]]',
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
        (dimension) => {
            if (
                dimension.trackedEntityTypeId === trackedEntityType.id &&
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
        },
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
