import {
    useMetadataStore,
    type UseMetadataStoreReturnValue,
} from '@components/app-wrapper/metadata-provider/metadata-provider'
import { getFakeTotal } from '@components/line-list/totals-debug'
import type { LineListPager } from '@components/line-list/types'
import { Analytics } from '@dhis2/analytics'
// eslint-disable-next-line no-restricted-imports
import { useDataEngine } from '@dhis2/app-runtime'
import { analyticsHeaderToCanonicalDimensionId } from '@modules/analytics-request'
import { EmptyResponseError } from '@modules/error/empty-response-error'
import { isAbortError } from '@modules/error/is-abort-error'
import { logger } from '@modules/logger'
import { isVisualizationWithTimeDimension } from '@modules/visualization/guards'
import { getSingleProgramFromVisualization } from '@modules/visualization/program'
import type {
    CurrentUser,
    CurrentVisualization,
    GridHeader,
    LegendSet,
    MetadataInputItem,
    UserOrgUnitMetadataItem,
} from '@types'
import { useCallback, useRef, useState } from 'react'
import { useErrorBoundary } from 'react-error-boundary'
import { getAnalyticsEndpoint } from './query-tools-common'
import {
    getAdaptedVisualization,
    getBaseRequestIdentity,
} from './query-tools-line-list'
import { useInFlightDedup } from './use-in-flight-dedup'

export type AnalyticsResponseMetadataItems = Record<
    string,
    MetadataInputItem
> & {
    USER_ORG_UNIT?: UserOrgUnitMetadataItem
}

export type LineListRowContext = Record<
    string,
    Record<string, { valueStatus?: string } | undefined> | undefined
>

export type LineListLegendSet = Pick<LegendSet, 'id' | 'name' | 'legends'>

export type LineListAnalyticsDataHeader = GridHeader & {
    /* Canonical store ID for this column, computed once here so the
     * wire-to-canonical translation happens exactly once per response. */
    dimensionId: string
}

export type LineListAnalyticsData = {
    headers: Array<LineListAnalyticsDataHeader>
    rows: string[][]
    rowContext?: LineListRowContext
    pager: LineListPager
    metaDataItems: AnalyticsResponseMetadataItems
    /* The legend sets the visualization's legend strategy refers to,
     * fetched here so the transformation stays synchronous. */
    legendSets: LineListLegendSet[]
}

export type LineListAnalyticsResponse = {
    headers: Array<GridHeader>
    rows: string[][]
    rowContext?: LineListRowContext
    metaData: {
        items: AnalyticsResponseMetadataItems
        pager: LineListPager
    }
}

type FetchAnalyticsDataForLLParams = {
    analyticsEngine: ReturnType<typeof Analytics.getAnalytics>
    visualization: CurrentVisualization
    pageSize: number
    page: number
    relativePeriodDate: unknown
    sortField: string | undefined
    sortDirection: 'ASC' | 'DESC' | undefined
    displayProperty: CurrentUser['settings']['displayProperty']
}

type FetchAnalyticsDataParams = {
    visualization: CurrentVisualization
    relativePeriodDate?: string
    displayProperty: CurrentUser['settings']['displayProperty']
    pageSize?: number
    page?: number
    onResponseReceived: () => void
}
type FetchAnalyticsDataFn = (params: FetchAnalyticsDataParams) => Promise<void>
type AnalyticsDataState = {
    isFetching: boolean
    data: LineListAnalyticsData | null
}
type UseAnalyticsDataResult = [FetchAnalyticsDataFn, AnalyticsDataState]

const withFakeTotals = ({
    pager,
    rows,
}: {
    pager: LineListPager
    rows: string[][]
}): { pager: LineListPager; rows: string[][] } => {
    const fakeTotal = getFakeTotal()
    if (fakeTotal === null) {
        return { pager, rows }
    }
    const rowsBeforePage = (pager.page - 1) * pager.pageSize
    const total = pager.isLastPage
        ? rowsBeforePage + rows.length
        : Math.max(fakeTotal, rowsBeforePage + 1)
    return {
        pager: {
            page: pager.page,
            pageSize: pager.pageSize,
            total,
            pageCount: Math.max(1, Math.ceil(total / pager.pageSize)),
        },
        rows: rows.slice(0, total - rowsBeforePage),
    }
}

const fetchAnalyticsDataForLL = async ({
    analyticsEngine,
    visualization,
    pageSize,
    page,
    relativePeriodDate,
    sortField,
    sortDirection,
    displayProperty,
}: FetchAnalyticsDataForLLParams): Promise<LineListAnalyticsResponse> => {
    const { adaptedVisualization, headers, parameters } =
        getAdaptedVisualization(visualization)

    logger.debug('adaptedVisualization', adaptedVisualization)

    let req = new analyticsEngine.request()
        .fromVisualization(adaptedVisualization)
        .withParameters({
            headers,
            totalPages: false,
            ...(visualization.outputType !== 'EVENT'
                ? { rowContext: true }
                : {}),
            ...parameters,
        })
        .withPageSize(pageSize)
        .withPage(page)
        .withIncludeMetadataDetails()

    if (displayProperty) {
        req = req.withDisplayProperty(displayProperty.toUpperCase())
    }

    // trackedEntity request can use multiple programs
    if (visualization.outputType !== 'TRACKED_ENTITY_INSTANCE') {
        req = req
            .withProgram(getSingleProgramFromVisualization(visualization).id)
            .withOutputType(visualization.outputType)
    }

    if (visualization.outputType === 'TRACKED_ENTITY_INSTANCE') {
        const trackedEntityTypeId = visualization.trackedEntityType?.id

        if (trackedEntityTypeId) {
            req = req.withTrackedEntityType(trackedEntityTypeId)
        }
    }

    if (relativePeriodDate && isVisualizationWithTimeDimension(visualization)) {
        req = req.withRelativePeriodDate(relativePeriodDate)
    }

    if (sortField) {
        switch (sortDirection) {
            case 'ASC':
                req = req.withAsc(sortField)
                break
            case 'DESC':
                req = req.withDesc(sortField)
                break
        }
    }

    const analyticsApiEndpoint = getAnalyticsEndpoint(visualization.outputType)

    const rawResponse =
        await analyticsEngine[analyticsApiEndpoint].getQuery(req)

    return rawResponse
}

const legendSetsQuery = {
    resource: 'legendSets',
    params: (variables: Record<string, unknown>) => ({
        // legend sets and legends have no shortName, so the name always comes from displayName
        fields: 'id,displayName~rename(name),legends[id,displayName~rename(name),startValue,endValue,color]',
        filter: `id:in:[${(variables.ids as string[]).join(',')}]`,
    }),
}

const apiFetchLegendSetsByIds = async ({
    dataEngine,
    ids,
}: {
    dataEngine: ReturnType<typeof useDataEngine>
    ids: string[]
}): Promise<LineListLegendSet[]> => {
    const legendSetsData = (await dataEngine.query(
        { legendSets: legendSetsQuery },
        {
            variables: { ids },
        }
    )) as { legendSets: { legendSets: LineListLegendSet[] } }

    return legendSetsData.legendSets.legendSets
}

const fetchLegendSets = async ({
    legendSetIds,
    dataEngine,
}: {
    legendSetIds: string[]
    dataEngine: ReturnType<typeof useDataEngine>
}): Promise<LineListLegendSet[]> => {
    if (!legendSetIds.length) {
        return []
    }

    const legendSets = await apiFetchLegendSetsByIds({
        dataEngine,
        ids: legendSetIds,
    })

    return legendSets
}

export const collectLegendSetIdsToFetch = (
    headers: Array<LineListAnalyticsDataHeader>,
    visualization: CurrentVisualization,
    metadataStore: UseMetadataStoreReturnValue
): string[] => {
    const { legend } = visualization
    if (legend?.strategy === 'FIXED') {
        return legend.set?.id ? [legend.set.id] : []
    }
    if (legend?.strategy === 'BY_DATA_ITEM') {
        const ids: string[] = []
        for (const header of headers) {
            const item = metadataStore.getDimensionMetadataItem(
                header.dimensionId
            )
            if (item?.legendSetId) {
                ids.push(item.legendSetId)
            }
        }
        return ids
    }
    return []
}

export const toLineListAnalyticsData = ({
    response,
    visualization,
    legendSets = [],
}: {
    response: LineListAnalyticsResponse
    visualization: CurrentVisualization
    legendSets?: LineListLegendSet[]
}): LineListAnalyticsData => ({
    headers: response.headers.map((header) => ({
        ...header,
        dimensionId: analyticsHeaderToCanonicalDimensionId(
            header.name ?? '',
            visualization
        ),
    })),
    ...withFakeTotals({ pager: response.metaData.pager, rows: response.rows }),
    rowContext: response.rowContext,
    metaDataItems: response.metaData.items,
    legendSets,
})

export const useLineListAnalyticsData = (): UseAnalyticsDataResult => {
    const dataEngine = useDataEngine()
    const metadataStore = useMetadataStore()
    const [analyticsEngine] = useState(() => Analytics.getAnalytics(dataEngine))
    const { showBoundary } = useErrorBoundary()

    const [state, setState] = useState<AnalyticsDataState>({
        isFetching: false,
        data: null,
    })

    const { reserve, release } = useInFlightDedup()
    /* Only the most recent request may update state, so a slow response for
     * a page the user already clicked past can't overwrite the newer one. */
    const latestRequestIdRef = useRef(0)

    const fetchAnalyticsData: FetchAnalyticsDataFn = useCallback(
        async ({
            visualization,
            relativePeriodDate,
            displayProperty,
            pageSize = 100,
            page = 1,
            onResponseReceived,
        }) => {
            const requestSignature = JSON.stringify({
                ...getBaseRequestIdentity(visualization, relativePeriodDate),
                sorting: visualization.sorting ?? null,
                page,
                pageSize,
                displayProperty,
            })

            if (!reserve(requestSignature)) {
                return
            }

            const requestId = ++latestRequestIdRef.current
            const isStale = () => requestId !== latestRequestIdRef.current

            setState((prevState) => ({
                ...prevState,
                isFetching: true,
            }))

            const { dimension: sortField, direction: sortDirection } =
                visualization.sorting?.length
                    ? visualization.sorting[0]
                    : { dimension: undefined, direction: undefined }

            try {
                const analyticsResponse = await fetchAnalyticsDataForLL({
                    analyticsEngine,
                    page,
                    pageSize,
                    relativePeriodDate,
                    sortDirection,
                    sortField,
                    visualization,
                    displayProperty,
                })

                if (isStale()) {
                    return
                }

                /* Without totals the user can click past the last page. Keep
                 * the current page and hand back a fresh pager object so the
                 * pagination bar snaps back to it. */
                if (analyticsResponse.rows.length === 0 && page > 1) {
                    setState((prevState) =>
                        prevState.data
                            ? {
                                  data: {
                                      ...prevState.data,
                                      pager: { ...prevState.data.pager },
                                  },
                                  isFetching: false,
                              }
                            : prevState
                    )
                    return
                }

                if (analyticsResponse.rows.length === 0) {
                    throw new EmptyResponseError()
                }

                const dataWithoutLegendSets = toLineListAnalyticsData({
                    response: analyticsResponse,
                    visualization,
                })

                const legendSetIds = collectLegendSetIdsToFetch(
                    dataWithoutLegendSets.headers,
                    visualization,
                    metadataStore
                )
                const legendSets = await fetchLegendSets({
                    legendSetIds,
                    dataEngine,
                })

                if (isStale()) {
                    return
                }

                const analyticsData: LineListAnalyticsData = {
                    ...dataWithoutLegendSets,
                    legendSets,
                }

                setState({
                    data: analyticsData,
                    isFetching: false,
                })

                onResponseReceived()
            } catch (error) {
                if (isStale()) {
                    return
                }
                logger.error('fetch LL data error', error)
                if (isAbortError(error)) {
                    setState((prevState) => ({
                        data: prevState.data,
                        isFetching: false,
                    }))
                } else {
                    showBoundary(error)
                }
            } finally {
                release(requestSignature)
            }
        },
        [
            analyticsEngine,
            dataEngine,
            metadataStore,
            reserve,
            release,
            showBoundary,
        ]
    )

    return [fetchAnalyticsData, state]
}
