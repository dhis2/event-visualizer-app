import {
    DimensionCard,
    DimensionsCardSubsection,
    DimensionListItem,
} from '@components/main-sidebar/dimension-card'
import type { DataSourceProgramWithRegistration } from '@types'

type CardEventProps = {
    program: DataSourceProgramWithRegistration
}

export const CardEvent = ({ program }: CardEventProps) => {
    const label = 'Event data'

    return (
        <DimensionCard
            dimensionCardKey="event-with-registration"
            title={label}
            withSubSections
        >
            {program.programStages!.map((stage) => (
                <DimensionsCardSubsection title={stage.name} key={stage.id}>
                    <DimensionListItem />
                    <DimensionListItem />
                </DimensionsCardSubsection>
            ))}
        </DimensionCard>
    )
}
