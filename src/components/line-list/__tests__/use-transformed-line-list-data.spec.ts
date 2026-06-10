import type { LineListAnalyticsDataHeader } from '@components/line-list/types'
import { describe, it, expect } from 'vitest'
import { getHeaderDisplayText } from '../use-transformed-line-list-data'

const buildHeader = (
    partial: Partial<LineListAnalyticsDataHeader>
): LineListAnalyticsDataHeader =>
    ({ valueType: 'TEXT', ...partial }) as LineListAnalyticsDataHeader

describe('getHeaderDisplayText', () => {
    it('returns the base column name when there is no suffix', () => {
        expect(
            getHeaderDisplayText(buildHeader({ column: 'Scheduled date' }))
        ).toBe('Scheduled date')
    })

    it('appends the contextual dimension suffix to the base name', () => {
        expect(
            getHeaderDisplayText(
                buildHeader({
                    column: 'Scheduled date',
                    dimensionSuffix: 'Birth',
                })
            )
        ).toBe('Scheduled date · Birth')
    })

    it('does not accumulate the suffix across renders of the same header', () => {
        const header = buildHeader({
            column: 'Scheduled date',
            dimensionSuffix: 'Birth',
        })

        const first = getHeaderDisplayText(header)
        const second = getHeaderDisplayText(header)

        expect(first).toBe('Scheduled date · Birth')
        expect(second).toBe('Scheduled date · Birth')
    })

    it('combines the dimension suffix with the repetition suffix', () => {
        expect(
            getHeaderDisplayText(
                buildHeader({
                    column: 'Scheduled date',
                    dimensionSuffix: 'Birth',
                    stageOffset: 0,
                })
            )
        ).toBe('Scheduled date · Birth (most recent)')
    })

    it('returns an empty string when there is no column', () => {
        expect(
            getHeaderDisplayText(buildHeader({ dimensionSuffix: 'Birth' }))
        ).toBe('')
    })
})
