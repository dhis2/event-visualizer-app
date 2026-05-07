import type { DataSourceProgramWithoutRegistration } from '@types'
import type { FC } from 'react'
import { CardEvent } from './card-event'
import { CardProgramIndicators } from './card-program-indicators'

type CardsProgramWithoutRegistrationProps = {
    program: DataSourceProgramWithoutRegistration
}

export const CardsProgramWithoutRegistration: FC<
    CardsProgramWithoutRegistrationProps
> = ({ program }) => {
    return (
        <>
            <CardEvent program={program} />
            <CardProgramIndicators program={program} />
        </>
    )
}
