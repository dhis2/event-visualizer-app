import {
    useMetadataStore,
    type UseMetadataStoreReturnValue,
} from '@components/app-wrapper/metadata-provider/metadata-provider'
import type {
    LineListAnalyticsData,
    LineListAnalyticsDataHeader,
} from '@components/line-list/types.js'
import { Analytics } from '@dhis2/analytics'
// eslint-disable-next-line no-restricted-imports
import { type FetchError, useDataEngine } from '@dhis2/app-runtime'
import { formatBooleanValue, isBooleanValue } from '@modules/conditions'
import {
    getDimensionSuffixes,
    type SuffixInput,
} from '@modules/dimension-suffix'
import { logger } from '@modules/logger'
import { isValueTypeNumeric } from '@modules/value-type'
import {
    analyticsHeaderToCanonicalDimensionId,
    getSingleProgramFromVisualization,
    isVisualizationWithTimeDimension,
} from '@modules/visualization'
import type {
    CurrentUser,
    CurrentVisualization,
    DimensionMetadataItem,
    GridHeader,
    MetadataInputItem,
    UserOrgUnitMetadataItem,
} from '@types'
import { useCallback, useState } from 'react'
import { getAnalyticsEndpoint } from './query-tools-common'
import { getAdaptedVisualization } from './query-tools-line-list'

type OptionSetMetaDataItem = MetadataInputItem & {
    options: Array<{ code?: string; uid?: string }>
}

type IndexedLineListAnalyticsDataHeader = LineListAnalyticsDataHeader & {
    index: number
}

type RowContext = Record<
    string,
    Record<string, { valueStatus?: string } | undefined> | undefined
>

type LineListAnalyticsResponse = {
    headers: Array<GridHeader>
    rows: string[][]
    rowContext?: RowContext
    metaData: {
        items: AnalyticsResponseMetadataItems
        pager?: LineListAnalyticsData['pager']
    }
}

const lookupOptionSetOptionMetadata = (
    optionSetId: string,
    code: string,
    metaDataItems: AnalyticsResponseMetadataItems
) => {
    const optionSetMetaData = metaDataItems?.[optionSetId] as
        | OptionSetMetaDataItem
        | undefined

    if (optionSetMetaData) {
        const optionId = optionSetMetaData.options.find(
            (option) => option.code === code
        )?.uid

        return optionId ? metaDataItems[optionId] : undefined
    }

    return undefined
}
const NOT_DEFINED_VALUE = 'ND'

export const cellIsUndefined = (
    rowContext: RowContext | undefined,
    rowIndex: number,
    columnIndex: number
) => rowContext?.[rowIndex]?.[columnIndex]?.valueStatus === NOT_DEFINED_VALUE

type FormatRowValueArgs = {
    rowValue: string
    header: LineListAnalyticsDataHeader
    metaDataItems: AnalyticsResponseMetadataItems
    isUndefined: boolean
}

export const formatRowValue = ({
    rowValue,
    header,
    metaDataItems,
    isUndefined,
}: FormatRowValueArgs) => {
    if (!rowValue) {
        return rowValue
    }

    switch (header.valueType) {
        case 'BOOLEAN':
        case 'TRUE_ONLY':
            if (isUndefined) {
                return ''
            }
            return isBooleanValue(rowValue)
                ? formatBooleanValue(rowValue)
                : rowValue
        default: {
            const { optionSet: optionSetId } = header
            if (optionSetId) {
                return rowValue
                    .split(',')
                    .map(
                        (code) =>
                            lookupOptionSetOptionMetadata(
                                optionSetId,
                                code,
                                metaDataItems
                            )?.name || code
                    )
                    .join(', ')
            }

            return metaDataItems[rowValue]?.name || rowValue
        }
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
}: FetchAnalyticsDataForLLParams) => {
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
    logger.debug('LL req', req)
    const analyticsApiEndpoint = getAnalyticsEndpoint(visualization.outputType)

    const rawResponse =
        await analyticsEngine[analyticsApiEndpoint].getQuery(req)

    return rawResponse
}

type HeaderLegendSet = NonNullable<LineListAnalyticsDataHeader['legendSet']>

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
}): Promise<HeaderLegendSet[]> => {
    const legendSetsData = (await dataEngine.query(
        { legendSets: legendSetsQuery },
        {
            variables: { ids },
        }
    )) as { legendSets: { legendSets: HeaderLegendSet[] } }

    return legendSetsData.legendSets.legendSets
}

const fetchLegendSets = async ({
    legendSetIds,
    dataEngine,
}: {
    legendSetIds: string[]
    dataEngine: ReturnType<typeof useDataEngine>
}): Promise<HeaderLegendSet[]> => {
    if (!legendSetIds.length) {
        return []
    }

    const legendSets = await apiFetchLegendSetsByIds({
        dataEngine,
        ids: legendSetIds,
    })

    return legendSets
}

type ResolveLegendSetArgs = {
    dimensionId: string
    valueType: GridHeader['valueType']
    legend: CurrentVisualization['legend']
    metadataStore: UseMetadataStoreReturnValue
    legendSets: HeaderLegendSet[]
}

const resolveLegendSet = ({
    dimensionId,
    valueType,
    legend,
    metadataStore,
    legendSets,
}: ResolveLegendSetArgs): HeaderLegendSet | undefined => {
    if (!legendSets.length || !isValueTypeNumeric(valueType)) {
        return undefined
    }
    if (legend?.strategy === 'FIXED') {
        return legendSets[0]
    }
    if (legend?.strategy === 'BY_DATA_ITEM') {
        const item = metadataStore.getDimensionMetadataItem(dimensionId)
        if (!item?.legendSetId) {
            return undefined
        }
        return legendSets.find((legendSet) => legendSet.id === item.legendSetId)
    }
    return undefined
}

export const collectLegendSetIdsToFetch = (
    analyticsResponse: LineListAnalyticsResponse,
    visualization: CurrentVisualization,
    metadataStore: UseMetadataStoreReturnValue
): string[] => {
    const { legend } = visualization
    if (legend?.strategy === 'FIXED') {
        return legend.set?.id ? [legend.set.id] : []
    }
    if (legend?.strategy === 'BY_DATA_ITEM') {
        const ids: string[] = []
        for (const header of analyticsResponse.headers) {
            const dimensionId = analyticsHeaderToCanonicalDimensionId(
                header.name ?? '',
                visualization
            )
            const item = metadataStore.getDimensionMetadataItem(dimensionId)
            if (item?.legendSetId) {
                ids.push(item.legendSetId)
            }
        }
        return ids
    }
    return []
}

type BuildHeadersArgs = {
    analyticsResponse: LineListAnalyticsResponse
    visualization: CurrentVisualization
    metadataStore: UseMetadataStoreReturnValue
    legendSets?: HeaderLegendSet[]
}

export const buildHeaders = ({
    analyticsResponse,
    visualization,
    metadataStore,
    legendSets = [],
}: BuildHeadersArgs): Array<IndexedLineListAnalyticsDataHeader> => {
    const canonicalIds: string[] = analyticsResponse.headers.map(
        (header: GridHeader) =>
            analyticsHeaderToCanonicalDimensionId(
                header.name ?? '',
                visualization
            )
    )

    const storeMetadata: Record<string, DimensionMetadataItem> = {}
    for (const id of canonicalIds) {
        const item = metadataStore.getDimensionMetadataItem(id)
        if (item) {
            storeMetadata[id] = item
        }
    }

    const metadata = { ...analyticsResponse.metaData.items, ...storeMetadata }

    const suffixInputs: SuffixInput[] = canonicalIds.map((id) => {
        const storeItem = storeMetadata[id]
        return {
            id,
            dimensionType: storeItem?.dimensionType,
            programId: storeItem?.programId,
            programStageId: storeItem?.programStageId,
            trackedEntityTypeId: storeItem?.trackedEntityTypeId,
        }
    })

    const suffixes = getDimensionSuffixes(
        suffixInputs,
        (id) => metadata[id]?.name
    )

    const nameById = new Map<string, string>(
        canonicalIds.map((id) => [id, metadata[id]?.name ?? id])
    )

    return analyticsResponse.headers.map(
        (header, index): IndexedLineListAnalyticsDataHeader => {
            const dimensionId = canonicalIds[index]
            return {
                ...header,
                legendSet: resolveLegendSet({
                    dimensionId,
                    valueType: header.valueType,
                    legend: visualization.legend,
                    metadataStore,
                    legendSets,
                }),
                index,
                dimensionId,
                column: nameById.get(dimensionId) ?? header.column,
                dimensionSuffix: suffixes[dimensionId],
            }
        }
    )
}

const extractRows = (
    analyticsResponse: LineListAnalyticsResponse,
    headers: Array<IndexedLineListAnalyticsDataHeader>
) => {
    type FilteredRow = string[]

    const filteredRows: FilteredRow[] = []

    for (
        let rowIndex = 0, rowsCount = analyticsResponse.rows.length;
        rowIndex < rowsCount;
        rowIndex++
    ) {
        const row = analyticsResponse.rows[rowIndex]

        const filteredRow: FilteredRow = []

        for (
            let headerIndex = 0, headersCount = headers.length;
            headerIndex < headersCount;
            headerIndex++
        ) {
            const header = headers[headerIndex]
            const rowValue = row[header.index]

            filteredRow.push(
                formatRowValue({
                    rowValue,
                    header,
                    metaDataItems: analyticsResponse.metaData.items,
                    isUndefined: cellIsUndefined(
                        analyticsResponse.rowContext,
                        rowIndex,
                        headerIndex
                    ),
                })
            )
        }

        filteredRows.push(filteredRow)
    }

    return filteredRows
}

export type AnalyticsResponseMetadataItems = Record<
    string,
    MetadataInputItem
> & {
    USER_ORG_UNIT?: UserOrgUnitMetadataItem
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
    filters?: Record<string, unknown>
    displayProperty: CurrentUser['settings']['displayProperty']
    pageSize?: number
    page?: number
    onResponseReceived: () => void
}
type FetchAnalyticsDataFn = (params: FetchAnalyticsDataParams) => Promise<void>
type AnalyticsDataState = {
    isFetching: boolean
    error?: FetchError
    data: LineListAnalyticsData | null
}
type UseAnalyticsDataResult = [FetchAnalyticsDataFn, AnalyticsDataState]

const useLineListAnalyticsData = (): UseAnalyticsDataResult => {
    const dataEngine = useDataEngine()
    const metadataStore = useMetadataStore()
    const [analyticsEngine] = useState(() => Analytics.getAnalytics(dataEngine))

    const [state, setState] = useState<AnalyticsDataState>({
        isFetching: false,
        error: undefined,
        data: null,
    })

    const fetchAnalyticsData: FetchAnalyticsDataFn = useCallback(
        async ({
            visualization,
            filters,
            displayProperty,
            pageSize = 100,
            page = 1,
            onResponseReceived,
        }) => {
            setState((prevState) => ({
                ...prevState,
                isFetching: true,
                error: undefined,
            }))

            const relativePeriodDate = filters?.relativePeriodDate

            const { dimension: sortField, direction: sortDirection } =
                visualization.sorting?.length
                    ? visualization.sorting[0]
                    : { dimension: undefined, direction: undefined }

            try {
                logger.debug('in fetch analytics data try')
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

                const legendSetIds = collectLegendSetIdsToFetch(
                    analyticsResponse,
                    visualization,
                    metadataStore
                )
                const legendSets = await fetchLegendSets({
                    legendSetIds,
                    dataEngine,
                })

                const headers = buildHeaders({
                    analyticsResponse,
                    visualization,
                    metadataStore,
                    legendSets,
                })

                const rows = extractRows(analyticsResponse, headers)
                const { rowContext } = analyticsResponse
                const pager = analyticsResponse.metaData.pager

                const analyticsData = { headers, rows, pager, rowContext }

                setState({
                    data: analyticsData,
                    error: undefined,
                    isFetching: false,
                })

                onResponseReceived()
            } catch (error) {
                logger.error('fetch LL data error', error)
                setState({
                    data: null,
                    error: error as FetchError,
                    isFetching: false,
                })
            }
        },
        [analyticsEngine, dataEngine, metadataStore]
    )

    return [fetchAnalyticsData, state]
}

export { useLineListAnalyticsData }
