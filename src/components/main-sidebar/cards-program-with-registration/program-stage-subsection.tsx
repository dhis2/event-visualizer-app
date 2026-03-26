import { useMemo, type FC } from 'react'
import {
    DimensionList,
    DimensionsCardSubsection,
} from '@components/main-sidebar/dimension-card'
import { useSelectedDimensionCount } from '@components/main-sidebar/dimension-cards-provider'
import { createProgramStageMatchFn } from '@components/main-sidebar/dimension-cards-provider/matcher-functions'
import { getEventFixedDimensions } from '@components/main-sidebar/fixed-dimensions'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import { getDataElementQuery } from '@components/main-sidebar/use-dimension-list/query-helpers'
import { useCurrentUser } from '@hooks'
import type {
    DataSourceProgramWithRegistration,
    DimensionListKey,
    ProgramStage,
} from '@types'

export const ProgramStageSubsection: FC<{
    program: DataSourceProgramWithRegistration
    programStage: ProgramStage
}> = ({ program, programStage }) => {
    const {
        settings: { displayNameProperty },
    } = useCurrentUser()
    const dimensionListKey: DimensionListKey = `stage-${programStage.id}`
    const baseQuery = useMemo(
        () => getDataElementQuery(programStage.id, displayNameProperty),
        [programStage.id, displayNameProperty]
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
    const isSelectedMatchFn = useMemo(
        () => createProgramStageMatchFn(programStage.id),
        [programStage.id]
    )
    const selectedCount = useSelectedDimensionCount(isSelectedMatchFn)
    return (
        <DimensionsCardSubsection
            title={programStage.displayProgramStageLabel ?? programStage.name}
            isDisabled={listProps.isDisabledByFilter}
            selectedCount={selectedCount}
        >
            <DimensionList
                {...listProps}
                program={program}
                programStage={programStage}
            />
        </DimensionsCardSubsection>
    )
}
