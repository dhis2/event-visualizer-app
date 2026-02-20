import { useMemo, type FC } from 'react'
import { STAGE_QUERY_WITHOUT_STAGE_ID } from './card-event'
import {
    DimensionList,
    DimensionsCardSubsection,
} from '@components/main-sidebar/dimension-card'
import { getEventFixedDimensions } from '@components/main-sidebar/get-event-fixed-dimensions'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import type {
    DataSourceProgramWithRegistration,
    DimensionListKey,
    ProgramStage,
} from '@types'

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
        () => getEventFixedDimensions(program, programStage),
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
            isDisabled={listProps.isDisabledByFilter}
        >
            <DimensionList
                {...listProps}
                program={program}
                programStage={programStage}
            />
        </DimensionsCardSubsection>
    )
}
