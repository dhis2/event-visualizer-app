import {
    DimensionCard,
    DimensionList,
    DimensionListItem,
} from '@components/main-sidebar/dimension-card'
import type { DataSourceProgramWithRegistration } from '@types'

type CardProgramIndicatorsProps = {
    program: DataSourceProgramWithRegistration
}

export const CardProgramIndicators = ({
    program, // eslint-disable-line @typescript-eslint/no-unused-vars
}: CardProgramIndicatorsProps) => {
    const label = 'Program indicators'

    // TODO: Fetch program indicators
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const programIndicators: any[] = []

    // Hide card if there are 0 program indicators
    if (programIndicators.length === 0) {
        return null
    }

    return (
        <DimensionCard dimensionCardKey="program-indicators" title={label}>
            <DimensionList>
                {/* TODO: Render program indicators */}
                <DimensionListItem />
                <DimensionListItem />
            </DimensionList>
        </DimensionCard>
    )
}
