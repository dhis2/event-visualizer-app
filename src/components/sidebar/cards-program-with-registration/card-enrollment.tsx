import {
    DimensionCard,
    DimensionList,
} from '@components/sidebar/dimension-card'
import { useDimensionList } from '@components/sidebar/use-dimension-list'
import {
    useSelectedDimensionCount,
    type UseSelectedDimensionCountMatchFn,
} from '@components/sidebar/use-selected-dimension-count'
import i18n from '@dhis2/d2-i18n'
import { getEnrollmentFixedDimensions } from '@modules/dimension'
import type { DataSourceProgramWithRegistration, DimensionType } from '@types'
import { useCallback, useMemo, type FC } from 'react'

type CardEnrollmentProps = {
    program: DataSourceProgramWithRegistration
}

export const CardEnrollment: FC<CardEnrollmentProps> = ({ program }) => {
    const dimensionCardKey = 'enrollment'
    const title = program.displayEnrollmentLabel ?? i18n.t('Enrollment data')
    const fixedDimensions = useMemo(
        () => getEnrollmentFixedDimensions(program),
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
    const isSelectedMatchFn: UseSelectedDimensionCountMatchFn = useCallback(
        (dimension) =>
            dimensionTypeLookup.has(dimension.dimensionType) &&
            dimension.programId === program.id &&
            !dimension.programStageId,
        [dimensionTypeLookup, program.id]
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
