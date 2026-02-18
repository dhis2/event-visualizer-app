import i18n from '@dhis2/d2-i18n'
import { useMemo, type FC } from 'react'
import type { EventWithRegistrationFixedDimensionType } from './card-event'
import { STAGE_QUERY_WITHOUT_STAGE_ID } from './card-event'
import {
    DimensionList,
    DimensionsCardSubsection,
} from '@components/main-sidebar/dimension-card'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import type {
    DataSourceProgramWithRegistration,
    DimensionListKey,
    DimensionMetadataItem,
    ProgramStage,
} from '@types'

// This offers some level of assurance that the card disabled state
// stays correct if fixed dimensions are added
type StageFixedDimension = Omit<DimensionMetadataItem, 'dimensionType'> & {
    dimensionType: EventWithRegistrationFixedDimensionType
}
const getFixedDimensions = (
    program: DataSourceProgramWithRegistration,
    programStage: ProgramStage
): StageFixedDimension[] => {
    return [
        {
            id: `${programStage.id}.ou`,
            dimensionType: 'ORGANISATION_UNIT',
            name: program.displayOrgUnitLabel ?? i18n.t('Event org. unit'),
            valueType: 'ORGANISATION_UNIT',
        },
        {
            id: `${programStage.id}.eventDate`,
            dimensionType: 'PERIOD',
            name:
                programStage.displayExecutionDateLabel ?? i18n.t('Event date'),
            valueType: 'DATE',
        },
        {
            id: `${programStage.id}.scheduledDate`,
            dimensionType: 'PERIOD',
            name: programStage.displayDueDateLabel ?? i18n.t('Scheduled date'),
            valueType: 'DATE',
        },
        {
            id: `${programStage.id}.eventStatus`,
            dimensionType: 'STATUS',
            name: i18n.t('Event status'),
            valueType: 'TEXT',
        },
    ]
}

export const ProgramStageSubsection: FC<{
    program: DataSourceProgramWithRegistration
    programStage: ProgramStage
}> = ({ program, programStage }) => {
    const dimensionListKey: DimensionListKey = `stage-${programStage.id}`
    const baseQuery = useMemo(
        () => ({
            ...STAGE_QUERY_WITHOUT_STAGE_ID,
            params: {
                ...STAGE_QUERY_WITHOUT_STAGE_ID.params,
                programStageId: programStage.id,
            },
        }),
        [programStage]
    )
    const fixedDimensions = useMemo(
        () => getFixedDimensions(program, programStage),
        [program, programStage]
    )
    const listProps = useDimensionList({
        dimensionListKey,
        fixedDimensions,
        baseQuery,
    })
    return (
        <DimensionsCardSubsection
            title={programStage.displayProgramStageLabel ?? programStage.name}
        >
            <DimensionList
                {...listProps}
                program={program}
                programStage={programStage}
            />
        </DimensionsCardSubsection>
    )
}
