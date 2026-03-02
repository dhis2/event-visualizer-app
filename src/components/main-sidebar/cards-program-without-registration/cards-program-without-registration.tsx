import type { FC } from 'react'
import { CardEvent } from './card-event'
import type { DataSourceProgramWithoutRegistration } from '@types'

type CardsProgramWithoutRegistrationProps = {
    program: DataSourceProgramWithoutRegistration
}

export const CardsProgramWithoutRegistration: FC<
    CardsProgramWithoutRegistrationProps
> = ({ program }: CardsProgramWithoutRegistrationProps) => {
    return <CardEvent program={program} />
}
