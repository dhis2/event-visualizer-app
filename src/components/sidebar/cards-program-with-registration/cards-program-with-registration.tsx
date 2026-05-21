import type { DataSourceProgramWithRegistration } from '@types'
import type { FC } from 'react'
import { CardEnrollment } from './card-enrollment'
import { CardEvent } from './card-event'
import { CardProgramIndicators } from './card-program-indicators'
import { CardTrackedEntityType } from './card-tracked-entity-type'

type CardsProgramWithRegistrationProps = {
    program: DataSourceProgramWithRegistration
}

export const CardsProgramWithRegistration: FC<
    CardsProgramWithRegistrationProps
> = ({ program }) => (
    <>
        <CardEnrollment program={program} />
        <CardEvent program={program} />
        <CardTrackedEntityType program={program} />
        <CardProgramIndicators program={program} />
    </>
)
