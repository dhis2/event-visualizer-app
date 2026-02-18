import i18n from '@dhis2/d2-i18n'
import { useMemo } from 'react'
import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
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

export const CardTrackedEntityType = ({
    program,
}: CardTrackedEntityTypeProps) => {
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
        () => ({
            resource: 'analytics/trackedEntities/query/dimensions',
            params: {
                pageSize: 10,
                fields: [
                    'id',
                    'dimensionType',
                    'valueType',
                    'optionSet',
                    'displayName~rename(name)',
                ],
                filter: 'dimensionType:eq:PROGRAM_ATTRIBUTE',
                order: 'displayName:asc',
                trackedEntityType: program.trackedEntityType.id,
                program: program.id,
            },
        }),
        [program]
    )
    const listProps = useDimensionList({
        dimensionListKey: CARD_AND_LIST_KEY,
        baseQuery,
        fixedDimensions,
    })
    return (
        <DimensionCard dimensionCardKey={CARD_AND_LIST_KEY} title={title}>
            <DimensionList {...listProps} />
        </DimensionCard>
    )
}
