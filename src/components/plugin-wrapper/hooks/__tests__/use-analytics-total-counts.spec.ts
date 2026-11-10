import { useAnalyticsTotalCounts } from '@components/plugin-wrapper/hooks/use-analytics-total-counts'
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mockUseConfig = vi.hoisted(() => vi.fn())
vi.mock('@dhis2/app-runtime', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    useConfig: mockUseConfig,
}))

const renderWithSystemInfo = (systemInfo: unknown) => {
    mockUseConfig.mockReturnValue({ systemInfo })
    return renderHook(() => useAnalyticsTotalCounts()).result.current
}

describe('useAnalyticsTotalCounts', () => {
    it('is true when the server can count analytics totals', () => {
        expect(
            renderWithSystemInfo({ capability: { analyticsTotalCounts: true } })
        ).toBe(true)
    })

    it('is false when the server says it cannot', () => {
        expect(
            renderWithSystemInfo({
                capability: { analyticsTotalCounts: false },
            })
        ).toBe(false)
    })

    it('is false when the capability is missing', () => {
        expect(renderWithSystemInfo({ capability: {} })).toBe(false)
        expect(renderWithSystemInfo({ version: '2.42.0' })).toBe(false)
        expect(renderWithSystemInfo(undefined)).toBe(false)
    })
})
