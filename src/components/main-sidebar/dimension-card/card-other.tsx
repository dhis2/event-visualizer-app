import {
    DimensionCard,
    DimensionList,
    DimensionListItem,
} from '@components/main-sidebar/dimension-card'

export const CardOther = () => {
    // TODO: Fetch "Other" dimensions (Your dimensions)
    // TODO: Hide card if no dimensions to display
    const otherDimensions: string[] = []

    if (otherDimensions.length === 0) {
        return null
    }

    return (
        <DimensionCard dimensionCardKey="other" title="Other">
            <DimensionList>
                <DimensionListItem />
                <DimensionListItem />
            </DimensionList>
        </DimensionCard>
    )
}
