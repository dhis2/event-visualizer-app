import {
    DimensionCard,
    DimensionList,
} from '@components/sidebar/dimension-card'
import { useDimensionList } from '@components/sidebar/use-dimension-list'
import { defaultTransformer } from '@components/sidebar/use-dimension-list/default-transformer'
import type { Transformer } from '@components/sidebar/use-dimension-list/default-transformer'
import { getProgramAttributeQuery } from '@components/sidebar/use-dimension-list/query-helpers'
import {
    useSelectedDimensionCount,
    type UseSelectedDimensionCountMatchFn,
} from '@components/sidebar/use-selected-dimension-count'
import i18n from '@dhis2/d2-i18n'
import { useCurrentUser } from '@hooks'
import { getTrackedEntityTypeFixedDimensions } from '@modules/dimension'
import type { DataSourceProgramWithRegistration } from '@types'
import { useCallback, useMemo, type FC } from 'react'

const transformProgramAttributes = (
    data: unknown,
    trackedEntityTypeId: string
): ReturnType<Transformer> => {
    const { dimensions, nextPage } = defaultTransformer(data)
    return {
        nextPage,
        dimensions: dimensions.map((dimension) => ({
            ...dimension,
            id: `${trackedEntityTypeId}.${dimension.dimensionId ?? dimension.id}`,
            dimensionId: dimension.dimensionId ?? dimension.id,
            trackedEntityTypeId,
        })),
    }
}

type CardTrackedEntityTypeProps = {
    program: DataSourceProgramWithRegistration
}

const CARD_AND_LIST_KEY = 'program-tracked-entity-type'

export const CardTrackedEntityType: FC<CardTrackedEntityTypeProps> = ({
    program,
}) => {
    const {
        settings: { displayNameProperty },
    } = useCurrentUser()
    const title = i18n.t('{{- name}} registration', {
        name:
            program.displayTrackedEntityAttributeLabel ??
            program.trackedEntityType.name,
    })
    const fixedDimensions = useMemo(
        () => getTrackedEntityTypeFixedDimensions(program.trackedEntityType),
        [program.trackedEntityType]
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
            if (
                selectedDimension.id ===
                `${program.trackedEntityType.id}.enrollmentOu`
            ) {
                return true
            }
            return (
                selectedDimension.dimensionType === 'PROGRAM_ATTRIBUTE' &&
                selectedDimension.trackedEntityTypeId ===
                    program.trackedEntityType.id
            )
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
