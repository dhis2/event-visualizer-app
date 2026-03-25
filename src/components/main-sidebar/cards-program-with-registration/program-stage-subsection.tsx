import { useMemo, type FC } from 'react'
import {
    DimensionList,
    DimensionsCardSubsection,
} from '@components/main-sidebar/dimension-card'
import {
    EVENT_WITH_REGISTRATION_FIXED_DIMENSION_TYPES,
    getEventFixedDimensions,
} from '@components/main-sidebar/get-event-fixed-dimensions'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import { getDataElementQuery } from '@components/main-sidebar/use-dimension-list/query-helpers'
import {
    useSelectedDimensionCount,
    type UseSelectedDimensionCountMatchFn,
} from '@components/main-sidebar/use-selected-dimension-count'
import { useCurrentUser } from '@hooks'
import type {
    DataSourceProgramWithRegistration,
    DimensionListKey,
    DimensionType,
    ProgramStage,
} from '@types'

const STAGE_DIMENSION_TYPES = new Set<DimensionType>(
    EVENT_WITH_REGISTRATION_FIXED_DIMENSION_TYPES
)
STAGE_DIMENSION_TYPES.add('DATA_ELEMENT')

export const createIsSelectedMatchFn =
    (programStageId: string): UseSelectedDimensionCountMatchFn =>
    (dimension) =>
        STAGE_DIMENSION_TYPES.has(dimension.dimensionType) &&
        dimension.programStageId === programStageId

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
        () => createIsSelectedMatchFn(programStage.id),
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
