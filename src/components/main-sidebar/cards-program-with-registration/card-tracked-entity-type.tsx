import i18n from '@dhis2/d2-i18n'
import { useMemo, type FC } from 'react'
import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import { getProgramAttributeQuery } from '@components/main-sidebar/use-dimension-list/query-helpers'
import { useCurrentUser } from '@hooks'
import type {
    DataSourceProgramWithRegistration,
    DimensionMetadataItem,
} from '@types'

type CardTrackedEntityTypeProps = {
    program: DataSourceProgramWithRegistration
}

const CARD_AND_LIST_KEY = 'program-tracked-entity-type'

const getFixedDimensions = (
    program: DataSourceProgramWithRegistration
): DimensionMetadataItem[] => [
    {
        id: `${program.trackedEntityType.id}.ou`,
        dimensionType: 'ORGANISATION_UNIT',
        name: i18n.t('Registration org. unit'),
        valueType: 'ORGANISATION_UNIT',
    },
    {
        id: `${program.trackedEntityType.id}.created`,
        dimensionType: 'PERIOD',
        name: i18n.t('Registration date'),
        valueType: 'DATE',
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
    return (
        <DimensionCard
            dimensionCardKey={CARD_AND_LIST_KEY}
            title={title}
            isDisabledByFilter={listProps.isDisabledByFilter}
        >
            <DimensionList {...listProps} />
        </DimensionCard>
    )
}
