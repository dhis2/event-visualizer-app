import {
    DimensionList,
    DimensionsCardSubsection,
} from '@components/sidebar/dimension-card'
import {
    EVENT_WITH_REGISTRATION_FIXED_DIMENSION_TYPES,
    getEventFixedDimensions,
} from '@components/sidebar/get-event-fixed-dimensions'
import { useDimensionList } from '@components/sidebar/use-dimension-list'
import { getDataElementQuery } from '@components/sidebar/use-dimension-list/query-helpers'
import {
    useSelectedDimensionCount,
    type UseSelectedDimensionCountMatchFn,
} from '@components/sidebar/use-selected-dimension-count'
import { useCurrentUser } from '@hooks'
import type {
    DataSourceProgramWithRegistration,
    DimensionListKey,
    DimensionType,
    ProgramStage,
} from '@types'
import { useCallback, useMemo, type FC } from 'react'

const STAGE_DIMENSION_TYPES = new Set<DimensionType>(
    EVENT_WITH_REGISTRATION_FIXED_DIMENSION_TYPES
)
STAGE_DIMENSION_TYPES.add('DATA_ELEMENT')

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
    const isSelectedMatchFn: UseSelectedDimensionCountMatchFn = useCallback(
        (dimension) =>
            STAGE_DIMENSION_TYPES.has(dimension.dimensionType) &&
            dimension.programStageId === programStage.id,
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
