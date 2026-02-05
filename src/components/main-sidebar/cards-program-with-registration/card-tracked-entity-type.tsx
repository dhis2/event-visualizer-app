import {
    DimensionCard,
    DimensionList,
    DimensionListItem,
} from '@components/main-sidebar/dimension-card'
import type { DataSourceProgramWithRegistration } from '@types'

type CardTrackedEntityTypeProps = {
    program: DataSourceProgramWithRegistration
}

export const CardTrackedEntityType = ({
    program, // eslint-disable-line @typescript-eslint/no-unused-vars
}: CardTrackedEntityTypeProps) => {
    // TODO: Use tracked entity type name from program
    const label = 'Person registration'

    return (
        <DimensionCard
            dimensionCardKey="program-tracked-entity-type"
            title={label}
        >
            <DimensionList>
                {/* TODO: Add tracked entity dimensions:
                    - Registration org. unit
                    - Registration period
                    - Tracked entity type attributes from the selected program
                */}
                <DimensionListItem />
                <DimensionListItem />
            </DimensionList>
        </DimensionCard>
    )
}
