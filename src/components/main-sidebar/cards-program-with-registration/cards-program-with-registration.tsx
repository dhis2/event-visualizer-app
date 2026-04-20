import { CardEnrollmentProgramIndicators } from '@components/main-sidebar/dimension-card/card-enrollment-program-indicators'
import type { DataSourceProgramWithRegistration } from '@types'
import type { FC } from 'react'
import { CardEnrollment } from './card-enrollment'
import { CardEvent } from './card-event'
import { CardTrackedEntityType } from './card-tracked-entity-type'

type CardsProgramWithRegistrationProps = {
    program: DataSourceProgramWithRegistration
}

export const CardsProgramWithRegistration: FC<
    CardsProgramWithRegistrationProps
> = ({ program }) => {
    return (
        <>
            <CardEnrollment program={program} />
            <CardEvent program={program} />
            <CardTrackedEntityType program={program} />
            <CardEnrollmentProgramIndicators program={program} />
        </>
    )
}
