import type { UseMetadataStoreReturnValue } from '@components/app-wrapper/metadata-provider/metadata-provider'
import { extractMetadataFromAnalyticsResponse } from '@modules/metadata-store/analytics-data'
import type { CurrentVisualization, DimensionMetadataItem } from '@types'
import { describe, it, expect } from 'vitest'
import { extractHeaders } from './use-line-list-analytics-data'

const visualization = {
    outputType: 'EVENT',
    programDimensions: [{ id: 'p1' }],
} as unknown as CurrentVisualization

const analyticsResponse = {
    headers: [{ name: 's1.scheduledDate' }, { name: 's2.scheduledDate' }],
    metaData: {
        items: {
            s1: { name: 'Birth' },
            s2: { name: 'Baby Postnatal' },
        },
    },
} as unknown as Parameters<typeof extractHeaders>[0]

const buildMetadataStore = (
    scheduledDateName: string
): UseMetadataStoreReturnValue => {
    const items: Record<string, Partial<DimensionMetadataItem>> = {
        's1.scheduledDate': {
            name: scheduledDateName,
            programId: 'p1',
            programStageId: 's1',
        },
        's2.scheduledDate': {
            name: scheduledDateName,
            programId: 'p1',
            programStageId: 's2',
        },
    }
    return {
        getDimensionMetadataItem: (id: string) => items[id],
    } as unknown as UseMetadataStoreReturnValue
}

describe('extractHeaders', () => {
    it('keeps the base name in column and exposes the stage suffix separately', () => {
        const headers = extractHeaders(
            analyticsResponse,
            visualization,
            buildMetadataStore('Scheduled date')
        )

        expect(headers[0]).toMatchObject({
            dimensionId: 's1.scheduledDate',
            column: 'Scheduled date',
            dimensionSuffix: 'Birth',
        })
        expect(headers[1]).toMatchObject({
            dimensionId: 's2.scheduledDate',
            column: 'Scheduled date',
            dimensionSuffix: 'Baby Postnatal',
        })
    })

    it('does not accumulate the stage suffix across repeated updates', () => {
        const firstHeaders = extractHeaders(
            analyticsResponse,
            visualization,
            buildMetadataStore('Scheduled date')
        )

        const metadataAfterUpdate = extractMetadataFromAnalyticsResponse(
            analyticsResponse.metaData.items,
            firstHeaders
        ) as Record<string, { name?: string }>

        expect(metadataAfterUpdate['s1.scheduledDate'].name).toBe(
            'Scheduled date'
        )

        const storedName = metadataAfterUpdate['s1.scheduledDate']
            .name as string
        const secondHeaders = extractHeaders(
            analyticsResponse,
            visualization,
            buildMetadataStore(storedName)
        )

        expect(secondHeaders[0].column).toBe('Scheduled date')
        expect(secondHeaders[0].dimensionSuffix).toBe('Birth')
    })
})
