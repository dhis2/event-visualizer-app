import { CardEventProgramIndicators } from '@components/main-sidebar/dimension-card/card-event-program-indicators'
import type { DataSourceProgramWithoutRegistration } from '@types'
import type { FC } from 'react'
import { CardEvent } from './card-event'

type CardsProgramWithoutRegistrationProps = {
    program: DataSourceProgramWithoutRegistration
}

export const CardsProgramWithoutRegistration: FC<
    CardsProgramWithoutRegistrationProps
> = ({ program }) => {
    return (
        <>
            <CardEvent program={program} />
            <CardEventProgramIndicators program={program} />
        </>
    )
}
