import i18n from '@dhis2/d2-i18n'
import { useMemo, type FC } from 'react'
import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import { getProgramAttributeQuery } from '@components/main-sidebar/use-dimension-list/query-helpers'
import {
    useSelectedDimensionCount,
    type UseSelectedDimensionCountMatchFn,
} from '@components/main-sidebar/use-selected-dimension-count'
import { useCurrentUser } from '@hooks'
import type {
    DataSourceProgramWithRegistration,
    DimensionMetadataItem,
} from '@types'

type CardTrackedEntityTypeProps = {
    program: DataSourceProgramWithRegistration
}

const CARD_AND_LIST_KEY = 'program-tracked-entity-type'

export const createIsSelectedMatchFn =
    (trackedEntityTypeId: string): UseSelectedDimensionCountMatchFn =>
    (dimension) => {
        if (dimension.id === `${trackedEntityTypeId}.ou`) {
            return true
        }
        /* TEAs fetched from the web api have plain IDs, no enrichment context,
         * they can only be identified by the absence of a program/stage */
        if (
            dimension.dimensionType === 'PROGRAM_ATTRIBUTE' &&
            !dimension.programId &&
            !dimension.programStageId
        ) {
            return true
        }
        return false
    }

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
    const listProps = useDimensionList({
        dimensionListKey: CARD_AND_LIST_KEY,
        baseQuery,
        fixedDimensions,
    })
    const isSelectedMatchFn = useMemo(
        () => createIsSelectedMatchFn(program.trackedEntityType.id),
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
