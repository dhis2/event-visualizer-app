import { useItemAggregationType } from '@components/layout-panel/use-item-aggregation-type'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import type { DimensionMetadataItem } from '@types'
import { type FC } from 'react'
import { describe, it, expect, vi } from 'vitest'

const dataElement: DimensionMetadataItem = {
    id: 'stage1.apgar',
    dimensionId: 'apgar',
    dimensionType: 'DATA_ELEMENT',
    name: 'APGAR score',
    valueType: 'NUMBER',
}

/* A compound id resolves against its stage, so the stage and its program have
 * to be in the store alongside the data element. */
const dataElementMetadata = {
    prog1: {
        id: 'prog1',
        name: 'Birth',
        programType: 'WITHOUT_REGISTRATION' as const,
        programStages: [],
    },
    stage1: {
        id: 'stage1',
        name: 'Birth stage',
        repeatable: false,
        hideDueDate: false,
        program: { id: 'prog1' },
    },
    [dataElement.id]: dataElement,
}

const attribute: DimensionMetadataItem = {
    id: 'weight',
    dimensionId: 'weight',
    dimensionType: 'PROGRAM_ATTRIBUTE',
    name: 'Weight',
    valueType: 'NUMBER',
}

const Probe: FC<{ itemId: string }> = ({ itemId }) => (
    <p>{`type: ${useItemAggregationType(itemId).aggregationType ?? '-'}`}</p>
)

describe('getAggregationTypeByDimension', () => {
    it('fetches a data element by its plain id', async () => {
        const dataElements = vi.fn(
            async (_type: string, query: { id?: string }) => ({
                aggregationType: query.id === 'apgar' ? 'AVERAGE' : 'SUM',
            })
        )

        await renderWithAppWrapper(<Probe itemId={dataElement.id} />, {
            metadata: dataElementMetadata,
            queryData: { dataElements },
        })

        expect(await screen.findByText('type: AVERAGE')).toBeInTheDocument()
    })

    it('fetches a tracked entity attribute', async () => {
        await renderWithAppWrapper(<Probe itemId={attribute.id} />, {
            metadata: { [attribute.id]: attribute },
            queryData: {
                trackedEntityAttributes: async () => ({
                    aggregationType: 'MAX',
                }),
            },
        })

        expect(await screen.findByText('type: MAX')).toBeInTheDocument()
    })

    it('uses the aggregation type a saved visualization carries without fetching', async () => {
        const dataElements = vi.fn(async () => ({ aggregationType: 'SUM' }))

        await renderWithAppWrapper(<Probe itemId="apgar" />, {
            metadata: {
                apgar: {
                    id: 'apgar',
                    name: 'APGAR score',
                    aggregationType: 'LAST',
                },
            },
            queryData: { dataElements },
        })

        expect(screen.getByText('type: LAST')).toBeInTheDocument()
        expect(dataElements).not.toHaveBeenCalled()
    })

    it('resolves nothing for a dimension type without an aggregation type', async () => {
        const programIndicators = vi.fn(async () => ({
            aggregationType: 'SUM',
        }))

        await renderWithAppWrapper(<Probe itemId="indicator" />, {
            metadata: {
                indicator: {
                    id: 'indicator',
                    dimensionId: 'indicator',
                    dimensionType: 'PROGRAM_INDICATOR',
                    name: 'Indicator',
                },
            },
            queryData: { programIndicators },
        })

        expect(screen.getByText('type: -')).toBeInTheDocument()
        expect(programIndicators).not.toHaveBeenCalled()
    })

    it('resolves nothing when the request fails', async () => {
        const dataElements = vi.fn(async () => {
            throw new Error('Not found')
        })

        await renderWithAppWrapper(<Probe itemId={dataElement.id} />, {
            metadata: dataElementMetadata,
            queryData: { dataElements },
        })

        await vi.waitFor(() => expect(dataElements).toHaveBeenCalled())
        expect(screen.getByText('type: -')).toBeInTheDocument()
    })
})
