import i18n from '@dhis2/d2-i18n'
import { useMemo, type FC } from 'react'
import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import { useSelectedDimensionCount } from '@components/main-sidebar/dimension-cards-provider'
import { createEnrollmentMatchFn } from '@components/main-sidebar/dimension-cards-provider/matcher-functions'
import { getEnrollmentFixedDimensions } from '@components/main-sidebar/fixed-dimensions'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import type { DataSourceProgramWithRegistration, DimensionType } from '@types'

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
    const isSelectedMatchFn = useMemo(
        () => createEnrollmentMatchFn(program.id, dimensionTypeLookup),
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
