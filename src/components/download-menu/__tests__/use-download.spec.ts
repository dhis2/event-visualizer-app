import { currentVisSlice } from '@store/current-vis-slice'
import { renderHookWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import type { CurrentVisualization } from '@types'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDownload } from '../use-download'

vi.mock('@dhis2/app-runtime', () => ({
    useConfig: () => ({ baseUrl: 'https://test.tld', apiVersion: 43 }),
    useDataEngine: () => ({}),
}))

vi.mock('@hooks', async () => {
    const { useSelector } = await import('react-redux')
    return {
        useAppSelector: useSelector,
        useCurrentUser: () => ({ settings: { displayProperty: 'name' } }),
    }
})

const makeEventVis = (
    overrides: Partial<CurrentVisualization> = {}
): CurrentVisualization =>
    ({
        type: 'LINE_LIST',
        outputType: 'EVENT',
        columns: [],
        rows: [],
        filters: [],
        programDimensions: [{ id: 'prog-1', programStages: [] }],
        ...overrides,
    }) as unknown as CurrentVisualization

const makeTeiVis = (
    overrides: Partial<CurrentVisualization> = {}
): CurrentVisualization =>
    makeEventVis({
        outputType: 'TRACKED_ENTITY_INSTANCE',
        trackedEntityType: { id: 'tet-1', name: 'Person' },
        ...overrides,
    } as Partial<CurrentVisualization>)

const renderDownload = (currentVis: CurrentVisualization) => {
    const store = setupStore(
        { [currentVisSlice.name]: currentVisSlice.reducer },
        { [currentVisSlice.name]: currentVis }
    )
    return renderHookWithReduxStoreProvider(() => useDownload(), store)
}

const getOpenedUrl = (openSpy: ReturnType<typeof vi.spyOn>): URL =>
    new URL(String(openSpy.mock.calls[0][0]))

describe('useDownload', () => {
    let openSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('LINE_LIST', () => {
        it('sends outputIdScheme=NAME and dataIdScheme=NAME for a table download', () => {
            const { result } = renderDownload(makeEventVis())

            result.current.download({ type: 'table', format: 'csv' })

            const params = getOpenedUrl(openSpy).searchParams
            expect(params.get('outputIdScheme')).toBe('NAME')
            expect(params.get('dataIdScheme')).toBe('NAME')
        })

        it('sends the requested idScheme as outputIdScheme for a plain download', () => {
            const { result } = renderDownload(makeEventVis())

            result.current.download({
                type: 'plain',
                format: 'csv',
                idScheme: 'UID',
            })

            expect(
                getOpenedUrl(openSpy).searchParams.get('outputIdScheme')
            ).toBe('UID')
        })

        it('sends outputIdScheme=NAME for a plain download with idScheme NAME', () => {
            const { result } = renderDownload(makeEventVis())

            result.current.download({
                type: 'plain',
                format: 'csv',
                idScheme: 'NAME',
            })

            const params = getOpenedUrl(openSpy).searchParams
            expect(params.get('outputIdScheme')).toBe('NAME')
            expect(params.get('dataIdScheme')).toBe('NAME')
        })

        it('forces both schemes on a table download for an enrollment output type', () => {
            const { result } = renderDownload(
                makeEventVis({ outputType: 'ENROLLMENT' })
            )

            result.current.download({ type: 'table', format: 'csv' })

            const url = getOpenedUrl(openSpy)
            expect(url.pathname).toContain('/enrollments/query/')
            expect(url.searchParams.get('outputIdScheme')).toBe('NAME')
            expect(url.searchParams.get('dataIdScheme')).toBe('NAME')
        })

        it('forces both schemes on a table download for a tracked entity output type', () => {
            const { result } = renderDownload(makeTeiVis())

            result.current.download({ type: 'table', format: 'csv' })

            const url = getOpenedUrl(openSpy)
            expect(url.pathname).toContain('/trackedEntities/query/')
            expect(url.searchParams.get('outputIdScheme')).toBe('NAME')
            expect(url.searchParams.get('dataIdScheme')).toBe('NAME')
        })

        it('sends the requested idScheme as outputIdScheme for a plain download of a tracked entity output type', () => {
            const { result } = renderDownload(makeTeiVis())

            result.current.download({
                type: 'plain',
                format: 'csv',
                idScheme: 'UID',
            })

            expect(
                getOpenedUrl(openSpy).searchParams.get('outputIdScheme')
            ).toBe('UID')
        })
    })

    describe('PIVOT_TABLE', () => {
        const makePivotVis = () => makeEventVis({ type: 'PIVOT_TABLE' })

        it('sends outputIdScheme=NAME for a table download', () => {
            const { result } = renderDownload(makePivotVis())

            result.current.download({ type: 'table', format: 'csv' })

            const params = getOpenedUrl(openSpy).searchParams
            expect(params.get('outputIdScheme')).toBe('NAME')
            expect(params.get('dataIdScheme')).toBe('NAME')
        })

        it('sends the requested idScheme as outputIdScheme for a plain download', () => {
            const { result } = renderDownload(makePivotVis())

            result.current.download({
                type: 'plain',
                format: 'csv',
                idScheme: 'UID',
            })

            expect(
                getOpenedUrl(openSpy).searchParams.get('outputIdScheme')
            ).toBe('UID')
        })

        it('forces both schemes on a table download for an enrollment output type', () => {
            const { result } = renderDownload(
                makeEventVis({
                    type: 'PIVOT_TABLE',
                    outputType: 'ENROLLMENT',
                })
            )

            result.current.download({ type: 'table', format: 'csv' })

            const url = getOpenedUrl(openSpy)
            expect(url.pathname).toContain('/enrollments/aggregate/')
            expect(url.searchParams.get('outputIdScheme')).toBe('NAME')
            expect(url.searchParams.get('dataIdScheme')).toBe('NAME')
        })

        /* The advanced submenu (data value set, JRXML, raw SQL) is only rendered
         * for pivot tables, and its items pass a `path` and no `idScheme`. A data
         * value set is identified by UID server-side, so no scheme is forced. */
        describe('advanced submenu', () => {
            it('targets the data value set endpoint without forcing a scheme', () => {
                const { result } = renderDownload(makePivotVis())

                result.current.download({
                    type: 'plain',
                    format: 'json',
                    path: 'dataValueSet',
                })

                const url = getOpenedUrl(openSpy)
                expect(url.pathname).toContain('/analytics/dataValueSet')
                expect(url.searchParams.get('outputIdScheme')).toBeNull()
                expect(url.searchParams.get('dataIdScheme')).toBeNull()
            })
        })
    })
})
