import type {
    LineListAnalyticsData,
    LineListAnalyticsDataHeader,
} from '@components/line-list/types.js'
import { Analytics } from '@dhis2/analytics'
// eslint-disable-next-line no-restricted-imports
import { type FetchError, useDataEngine } from '@dhis2/app-runtime'
import { getBooleanValues } from '@modules/conditions'
import {
    getDimensionIdParts,
    getDimensionsWithSuffix,
    getMainDimensions,
    getProgramDimensions,
} from '@modules/dimension'
import { isValueTypeNumeric } from '@modules/value-type'
import {
    composeLineListColumnId,
    getSingleProgramFromVisualization,
    isVisualizationWithTimeDimension,
} from '@modules/visualization'
import type {
    CurrentUser,
    CurrentVisualization,
    MetadataInputItem,
    OutputType,
    UserOrgUnitMetadataItem,
} from '@types'
import { useCallback, useState } from 'react'
import {
    getAdaptedVisualization,
    getAnalyticsEndpoint,
} from './query-tools-line-list.js'

const lookupOptionSetOptionMetadata = (optionSetId, code, metaDataItems) => {
    const optionSetMetaData = metaDataItems?.[optionSetId]

    if (optionSetMetaData) {
        const optionId = optionSetMetaData.options.find(
            (option) => option.code === code
        )?.uid

        return metaDataItems[optionId]
    }

    return undefined
}
const NOT_DEFINED_VALUE = 'ND'

export const cellIsUndefined = (rowContext = {}, rowIndex, columnIndex) =>
    (rowContext[rowIndex] || {})[columnIndex]?.valueStatus === NOT_DEFINED_VALUE

const formatRowValue = ({ rowValue, header, metaDataItems, isUndefined }) => {
    if (!rowValue) {
        return rowValue
    }

    switch (header.valueType) {
        case 'BOOLEAN':
        case 'TRUE_ONLY':
            return !isUndefined ? getBooleanValues()[rowValue] : ''
        default: {
            if (header.optionSet) {
                return (
                    lookupOptionSetOptionMetadata(
                        header.optionSet,
                        rowValue,
                        metaDataItems
                    )?.name || rowValue
                )
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

    console.log('adaptedVisualization', adaptedVisualization)

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
    console.log('LL req', req)
    const analyticsApiEndpoint = getAnalyticsEndpoint(visualization.outputType)

    const rawResponse =
        await analyticsEngine[analyticsApiEndpoint].getQuery(req)

    return rawResponse
}

const legendSetsQuery = {
    resource: 'legendSets',
    params: ({ ids }) => ({
        fields: 'id,displayName~rename(name),legends[id,displayName~rename(name),startValue,endValue,color]',
        filter: `id:in:[${ids.join(',')}]`,
    }),
}

const apiFetchLegendSetsByIds = async ({ dataEngine, ids }) => {
    const legendSetsData = await dataEngine.query(
        { legendSets: legendSetsQuery },
        {
            variables: { ids },
        }
    )

    return legendSetsData.legendSets.legendSets
}

const fetchLegendSets = async ({ legendSetIds, dataEngine }) => {
    if (!legendSetIds.length) {
        return []
    }

    const legendSets = await apiFetchLegendSetsByIds({
        dataEngine,
        ids: legendSetIds,
    })

    return legendSets
}

const extractHeaders = (
    analyticsResponse,
    outputType: OutputType
): Array<LineListAnalyticsDataHeader> => {
    const defaultMetadata = getMainDimensions(outputType)

    const dimensionIds = analyticsResponse.headers.map((header) => {
        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: header.name,
            outputType,
        })

        const formattedDimensionId = composeLineListColumnId({
            headerName: dimensionId,
            programStageId,
            programId,
            outputType,
        })

        if (
            (dimensionId === 'ouname' &&
                (programId || outputType !== 'TRACKED_ENTITY_INSTANCE')) ||
            dimensionId === 'programstatus' ||
            dimensionId === 'eventstatus'
            // org unit only if there's a programId or not tracked entity: this prevents pid.ou from being mixed up with just ou in TE
            // program status + event status in all cases
        ) {
            defaultMetadata[formattedDimensionId] = getProgramDimensions(
                // TODO: remove initialisation to '' and fix args order in function
                programId ?? ''
            )[formattedDimensionId]
        }

        return formattedDimensionId
    })

    const metadata = { ...analyticsResponse.metaData.items, ...defaultMetadata }

    const dimensionsWithSuffix = getDimensionsWithSuffix({
        dimensionIds,
        metadata,
        outputType,
    })

    const labels = dimensionsWithSuffix.map(({ name, suffix, id }) => ({
        id,
        label: suffix ? `${name}, ${suffix}` : name,
    }))

    const headers = analyticsResponse.headers.map((header, index) => {
        const result = { ...header, index }
        const { dimensionId, programId, programStageId } = getDimensionIdParts({
            id: header.name,
            outputType,
        })

        const formattedDimensionId = composeLineListColumnId({
            headerName: dimensionId,
            programId,
            programStageId,
            outputType,
        })

        result.column =
            labels.find((label) => label.id === formattedDimensionId)?.label ||
            result.column

        return result
    })
    return headers
}

const extractRows = (analyticsResponse, headers) => {
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

const extractRowContext = (analyticsResponse) => analyticsResponse.rowContext

export type AnalyticsResponseMetadataItems = Record<
    string,
    MetadataInputItem
> & {
    USER_ORG_UNIT?: UserOrgUnitMetadataItem
}

export type AnalyticsResponseMetadataDimensions = Record<string, string[]>
export type OnAnalyticsResponseReceivedCb = (
    items: AnalyticsResponseMetadataItems,
    headers: Array<LineListAnalyticsDataHeader>
) => void

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
    onResponseReceived: OnAnalyticsResponseReceivedCb
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
                console.log('in fetch analytics data try')
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

                const headers = extractHeaders(
                    analyticsResponse,
                    visualization.outputType
                )

                const rows = extractRows(analyticsResponse, headers)
                const rowContext = extractRowContext(analyticsResponse)
                const pager = analyticsResponse.metaData.pager

                const legendSetIds: string[] = [] // TODO: check this type
                const headerLegendSetMap: Record<string, string> =
                    headers.reduce((acc, header) => {
                        const metadataItem =
                            analyticsResponse.metaData.items[header.name!]
                        if (typeof metadataItem?.legendSetId === 'string') {
                            acc[header.name!] = metadataItem.legendSetId
                        }
                        return acc
                    }, {})
                if (
                    visualization.legend?.strategy === 'FIXED' &&
                    visualization.legend.set?.id
                ) {
                    legendSetIds.push(visualization.legend.set.id)
                } else if (visualization.legend?.strategy === 'BY_DATA_ITEM') {
                    Object.values(headerLegendSetMap)
                        .filter((legendSet) => legendSet)
                        .forEach((legendSet) => legendSetIds.push(legendSet))
                }
                const legendSets = await fetchLegendSets({
                    legendSetIds,
                    dataEngine,
                })

                if (legendSets.length) {
                    headers
                        .filter((header) =>
                            isValueTypeNumeric(header.valueType)
                        )
                        .forEach((header) => {
                            switch (visualization.legend?.strategy) {
                                case 'FIXED':
                                    header.legendSet = legendSets[0]
                                    break
                                case 'BY_DATA_ITEM': {
                                    header.legendSet = legendSets.find(
                                        (legendSet) =>
                                            legendSet.id ===
                                            headerLegendSetMap[header.name!]
                                    )
                                    break
                                }
                            }
                        })
                }

                const analyticsData = { headers, rows, pager, rowContext }

                setState({
                    data: analyticsData,
                    error: undefined,
                    isFetching: false,
                })

                onResponseReceived(analyticsResponse.metaData.items, headers)
            } catch (error) {
                console.log('fetch LL data error', error)
                setState({
                    data: null,
                    error,
                    isFetching: false,
                })
            }
        },
        [analyticsEngine, dataEngine]
    )

    return [fetchAnalyticsData, state]
}

export { useLineListAnalyticsData }
