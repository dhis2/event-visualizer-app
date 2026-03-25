import i18n from '@dhis2/d2-i18n'
import { useMemo, type FC } from 'react'
import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import {
    useSelectedDimensionCount,
    type UseSelectedDimensionCountMatchFn,
} from '@components/main-sidebar/use-selected-dimension-count'
import type {
    DataSourceProgramWithRegistration,
    DimensionMetadataItem,
    DimensionType,
} from '@types'

type CardEnrollmentProps = {
    program: DataSourceProgramWithRegistration
}

const getFixedDimensions = (
    program: DataSourceProgramWithRegistration
): DimensionMetadataItem[] => {
    return [
        {
            id: `${program.id}.ou`,
            dimensionId: 'ou',
            dimensionType: 'ORGANISATION_UNIT',
            name: program.displayOrgUnitLabel ?? i18n.t('Enrollment org. unit'),
            valueType: 'ORGANISATION_UNIT',
        },
        {
            id: `${program.id}.enrollmentDate`,
            dimensionId: 'enrollmentDate',
            dimensionType: 'PERIOD',
            name:
                program.displayEnrollmentDateLabel ??
                i18n.t('Date of enrollment'),
            valueType: 'DATE',
        },
        {
            id: `${program.id}.incidentDate`,
            dimensionId: 'incidentDate',
            dimensionType: 'PERIOD',
            name: program.displayIncidentDateLabel ?? i18n.t('Incident date'),
            valueType: 'DATE',
        },
        {
            id: `${program.id}.programStatus`,
            dimensionId: 'programStatus',
            dimensionType: 'STATUS',
            name: i18n.t('Enrollment status'),
            valueType: 'TEXT',
        },
    ]
}

export const createIsSelectedMatchFn =
    (
        programId: string,
        dimensionTypeLookup: Set<DimensionType>
    ): UseSelectedDimensionCountMatchFn =>
    (dimension) =>
        dimensionTypeLookup.has(dimension.dimensionType) &&
        dimension.programId === programId &&
        !dimension.programStageId

export const CardEnrollment: FC<CardEnrollmentProps> = ({ program }) => {
    const dimensionCardKey = 'enrollment'
    const title = program.displayEnrollmentLabel ?? i18n.t('Enrollment data')
    const fixedDimensions = useMemo(
        () => getFixedDimensions(program),
        [program]
    )
    const dimensionTypeLookup = useMemo(
        () =>
            new Set<DimensionType>(
                fixedDimensions.map((dimension) => dimension.dimensionType)
            ),
        [fixedDimensions]
    )
    const listProps = useDimensionList({ fixedDimensions })
    const isSelectedMatchFn = useMemo(
        () => createIsSelectedMatchFn(program.id, dimensionTypeLookup),
        [program.id, dimensionTypeLookup]
    )
    const selectedCount = useSelectedDimensionCount(isSelectedMatchFn)
    return (
        <DimensionCard
            dimensionCardKey={dimensionCardKey}
            title={title}
            isDisabledByFilter={listProps.isDisabledByFilter}
            selectedCount={selectedCount}
        >
            <DimensionList {...listProps} program={program} />
        </DimensionCard>
    )
}
