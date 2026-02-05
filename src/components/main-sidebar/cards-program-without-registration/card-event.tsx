import {
    DimensionCard,
    DimensionList,
    DimensionListItem,
} from '@components/main-sidebar/dimension-card'
import type { DataSourceProgramWithoutRegistration } from '@types'

type CardEventProps = {
    program: DataSourceProgramWithoutRegistration
}

export const CardEvent = ({
    program, // eslint-disable-line @typescript-eslint/no-unused-vars
}: CardEventProps) => {
    const label = 'Event data'

    return (
        <DimensionCard
            dimensionCardKey="event-without-registration"
            title={label}
        >
            <DimensionList>
                {/* TODO: Add event dimensions:
                    - Event organisation unit
                    - Event period(s)
                    - Event status
                    - Event data items (listed alphanumerically)
                */}
                <DimensionListItem />
                <DimensionListItem />
            </DimensionList>
        </DimensionCard>
    )
}
