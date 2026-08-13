import { useDimensionLegendSets } from '@components/dimension-modal/conditions-modal-content/use-dimension-legend-sets'
import { useMetadataItem } from '@hooks'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import type { DimensionMetadataItem } from '@types'
import { type FC } from 'react'
import { describe, it, expect } from 'vitest'

const numericDimension: DimensionMetadataItem = {
    id: 'numeric-de',
    dimensionId: 'numeric-de',
    dimensionType: 'DATA_ELEMENT',
    name: 'My numeric element',
    valueType: 'NUMBER',
}

const legendSets = [
    {
        id: 'LEGEND_SET_1',
        name: 'Weight legends',
        legends: [
            { id: 'LEGEND_2', name: 'High', startValue: 11, endValue: 20 },
            { id: 'LEGEND_1', name: 'Low', startValue: 0, endValue: 10 },
        ],
    },
]

/* The layout chip tooltip names a selected legend from its ID alone, so the
 * legends have to be resolvable from the store as individual items. */
const Probe: FC = () => {
    const { legendSets } = useDimensionLegendSets(numericDimension)
    const legend = useMetadataItem('LEGEND_1')
    const legendSet = useMetadataItem('LEGEND_SET_1')

    return (
        <ul>
            <li>{`sets: ${legendSets.map(({ name }) => name).join()}`}</li>
            <li>{`first legend: ${legendSets[0]?.legends[0]?.name ?? '-'}`}</li>
            <li>{`stored legend: ${legend?.name ?? '-'}`}</li>
            <li>{`stored set: ${legendSet?.name ?? '-'}`}</li>
        </ul>
    )
}

describe('getLegendSetsByDimension', () => {
    it('stores each legend set and legend, in band order', async () => {
        await renderWithAppWrapper(<Probe />, {
            metadata: { [numericDimension.id]: numericDimension },
            queryData: { dataElements: async () => ({ legendSets }) },
        })

        expect(
            await screen.findByText('sets: Weight legends')
        ).toBeInTheDocument()
        // sorted by startValue, not the order the API returned
        expect(screen.getByText('first legend: Low')).toBeInTheDocument()
        expect(screen.getByText('stored legend: Low')).toBeInTheDocument()
        expect(
            screen.getByText('stored set: Weight legends')
        ).toBeInTheDocument()
    })

    it('records the available legend sets on the dimension', async () => {
        const DimensionProbe: FC = () => {
            useDimensionLegendSets(numericDimension)
            const dimension = useMetadataItem(numericDimension.id)

            return (
                <p>{`options: ${
                    (
                        dimension as DimensionMetadataItem
                    )?.legendSetIds?.join() ?? '-'
                }`}</p>
            )
        }

        await renderWithAppWrapper(<DimensionProbe />, {
            metadata: { [numericDimension.id]: numericDimension },
            queryData: { dataElements: async () => ({ legendSets }) },
        })

        expect(
            await screen.findByText('options: LEGEND_SET_1')
        ).toBeInTheDocument()
    })

    it('fetches nothing for a dimension that cannot have legend sets', async () => {
        const TextProbe: FC = () => {
            const { legendSets, isLoading } = useDimensionLegendSets({
                ...numericDimension,
                valueType: 'TEXT',
            })

            return <p>{`sets: ${legendSets.length}, loading: ${isLoading}`}</p>
        }

        await renderWithAppWrapper(<TextProbe />, {
            metadata: { [numericDimension.id]: numericDimension },
        })

        expect(screen.getByText('sets: 0, loading: false')).toBeInTheDocument()
    })
})
