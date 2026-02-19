import i18n from '@dhis2/d2-i18n'
import { useMemo } from 'react'
import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import type { Transformer } from '@components/main-sidebar/use-dimension-list'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import { isObject, isPopulatedString } from '@modules/validation'
import type {
    DimensionMetadataItem,
    MetadataItemWithName,
    SingleQuery,
    ValueType,
} from '@types'

type CardTypeProps = {
    trackedEntityType: MetadataItemWithName
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
    trackedEntityType: MetadataItemWithName
): DimensionMetadataItem[] => {
    return [
        {
            id: `${trackedEntityType.id}.ou`,
            dimensionType: 'ORGANISATION_UNIT',
            name: i18n.t('Registration org. unit'),
            valueType: 'ORGANISATION_UNIT',
        },
        {
            id: `${trackedEntityType.id}.created`,
            dimensionType: 'PERIOD',
            name: i18n.t('Registration date'),
            valueType: 'DATE',
        },
    ]
}
export const CardType = ({ trackedEntityType }: CardTypeProps) => {
    const title = i18n.t('{{name}} registration', {
        name: trackedEntityType.name,
    })
    const fixedDimensions = useMemo(
        () => getFixedDimensions(trackedEntityType),
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

    return (
        <DimensionCard dimensionCardKey={CARD_AND_LIST_KEY} title={title}>
            <DimensionList {...listProps} />
        </DimensionCard>
    )
}
