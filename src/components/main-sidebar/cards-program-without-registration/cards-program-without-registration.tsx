import { CardEvent } from './card-event'
import type { DataSourceProgramWithoutRegistration } from '@types'

type CardsProgramWithoutRegistrationProps = {
    program: DataSourceProgramWithoutRegistration
}

export const CardsProgramWithoutRegistration = ({
    program,
}: CardsProgramWithoutRegistrationProps) => {
    return <CardEvent program={program} />
}
