import {
    DimensionCard,
    DimensionList,
    DimensionListItem,
} from '@components/main-sidebar/dimension-card'
import type { DataSourceProgramWithRegistration } from '@types'

type CardEnrollmentProps = {
    program: DataSourceProgramWithRegistration
}

export const CardEnrollment = ({
    program, // eslint-disable-line @typescript-eslint/no-unused-vars
}: CardEnrollmentProps) => {
    // TODO: Use custom label from program.displayEnrollmentLabel or fallback
    const label = 'Enrollment data'

    return (
        <DimensionCard dimensionCardKey="enrollment" title={label}>
            <DimensionList>
                {/* TODO: Add enrollment dimensions:
                    - Enrollment org. unit
                    - Enrollment period(s)
                    - Enrollment status (program status)
                */}
                <DimensionListItem />
                <DimensionListItem />
            </DimensionList>
        </DimensionCard>
    )
}
