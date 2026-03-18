import i18n from '@dhis2/d2-i18n'
import { useMemo, type FC } from 'react'
import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import type {
    DataSourceProgramWithRegistration,
    DimensionMetadataItem,
} from '@types'

type CardEnrollmentProps = {
    program: DataSourceProgramWithRegistration
}

const getFixedDimensions = (
    program: DataSourceProgramWithRegistration
): DimensionMetadataItem[] => {
    return [
        {
            id: 'ou',
            dimensionId: 'ou',
            dimensionType: 'ORGANISATION_UNIT',
            name: program.displayOrgUnitLabel ?? i18n.t('Enrollment org. unit'),
            valueType: 'ORGANISATION_UNIT',
        },
        {
            id: 'enrollmentDate',
            dimensionId: 'enrollmentDate',
            dimensionType: 'PERIOD',
            name:
                program.displayEnrollmentDateLabel ??
                i18n.t('Date of enrollment'),
            valueType: 'DATE',
        },
        {
            id: 'incidentDate',
            dimensionId: 'incidentDate',
            dimensionType: 'PERIOD',
            name: program.displayIncidentDateLabel ?? i18n.t('Incident date'),
            valueType: 'DATE',
        },
        {
            id: 'programStatus',
            dimensionId: 'programStatus',
            dimensionType: 'STATUS',
            name: i18n.t('Enrollment status'),
            valueType: 'TEXT',
        },
    ]
}

export const CardEnrollment: FC<CardEnrollmentProps> = ({ program }) => {
    const dimensionCardKey = 'enrollment'
    const title = program.displayEnrollmentLabel ?? i18n.t('Enrollment data')
    const fixedDimensions = useMemo(
        () => getFixedDimensions(program),
        [program]
    )
    const listProps = useDimensionList({ fixedDimensions })
    return (
        <DimensionCard
            dimensionCardKey={dimensionCardKey}
            title={title}
            isDisabledByFilter={listProps.isDisabledByFilter}
        >
            <DimensionList {...listProps} program={program} />
        </DimensionCard>
    )
}
