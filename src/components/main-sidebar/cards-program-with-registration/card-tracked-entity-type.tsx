import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import { defaultTransformer } from '@components/main-sidebar/use-dimension-list/default-transformer'
import type { Transformer } from '@components/main-sidebar/use-dimension-list/default-transformer'
import { getProgramAttributeQuery } from '@components/main-sidebar/use-dimension-list/query-helpers'
import {
    useSelectedDimensionCount,
    type UseSelectedDimensionCountMatchFn,
} from '@components/main-sidebar/use-selected-dimension-count'
import i18n from '@dhis2/d2-i18n'
import { useCurrentUser } from '@hooks'
import type {
    DataSourceProgramWithRegistration,
    DimensionMetadataItem,
} from '@types'
import { useCallback, useMemo, type FC } from 'react'

export const transformProgramAttributes = (
    data: unknown,
    trackedEntityTypeId: string
): ReturnType<Transformer> => {
    const { dimensions, nextPage } = defaultTransformer(data)
    return {
        nextPage,
        dimensions: dimensions.map((dimension) => ({
            ...dimension,
            trackedEntityTypeId,
        })),
    }
}

type CardTrackedEntityTypeProps = {
    program: DataSourceProgramWithRegistration
}

const CARD_AND_LIST_KEY = 'program-tracked-entity-type'

const getFixedDimensions = (
    program: DataSourceProgramWithRegistration
): DimensionMetadataItem[] => [
    {
        id: `${program.trackedEntityType.id}.ou`,
        dimensionId: 'ou',
        dimensionType: 'ORGANISATION_UNIT',
        name: i18n.t('Registration org. unit'),
        valueType: 'ORGANISATION_UNIT',
    },
]

export const CardTrackedEntityType: FC<CardTrackedEntityTypeProps> = ({
    program,
}) => {
    const {
        settings: { displayNameProperty },
    } = useCurrentUser()
    const title = i18n.t('{{name}} registration', {
        name:
            program.displayTrackedEntityAttributeLabel ??
            program.trackedEntityType.name,
    })
    const fixedDimensions = useMemo(
        () => getFixedDimensions(program),
        [program]
    )
    const baseQuery = useMemo(
        () =>
            getProgramAttributeQuery(
                program.id,
                program.trackedEntityType.id,
                displayNameProperty
            ),
        [program.id, program.trackedEntityType.id, displayNameProperty]
    )
    const transformer = useCallback<Transformer>(
        (data) =>
            transformProgramAttributes(data, program.trackedEntityType.id),
        [program.trackedEntityType.id]
    )
    const listProps = useDimensionList({
        dimensionListKey: CARD_AND_LIST_KEY,
        baseQuery,
        fixedDimensions,
        transformer,
    })
    const isSelectedMatchFn: UseSelectedDimensionCountMatchFn = useCallback(
        (selectedDimension) => {
            if (selectedDimension.id === `${program.trackedEntityType.id}.ou`) {
                return true
            }
            if (selectedDimension.dimensionType === 'PROGRAM_ATTRIBUTE') {
                return true
            }
            return false
        },
        [program.trackedEntityType.id]
    )
    const selectedCount = useSelectedDimensionCount(isSelectedMatchFn)
    return (
        <DimensionCard
            dimensionCardKey={CARD_AND_LIST_KEY}
            title={title}
            isDisabledByFilter={listProps.isDisabledByFilter}
            selectedCount={selectedCount}
        >
            <DimensionList {...listProps} program={program} />
        </DimensionCard>
    )
}
