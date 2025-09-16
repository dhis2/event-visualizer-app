// eslint-disable-next-line no-restricted-imports
import { useDataEngine } from '@dhis2/app-runtime'
import { useEffect, useState, useRef, useCallback } from 'react'
import {
    getAdaptedVisualization,
    getAnalyticsEndpoint,
} from './query-tools-line-list.js'
import { Analytics } from '@dhis2/analytics'
import { getBooleanValues } from '@modules/conditions'
import {
    getDimensionIdParts,
    getDimensionsWithSuffix,
    getFullDimensionId,
    getMainDimensions,
    getProgramDimensions,
} from '@modules/dimension'
import { isValueTypeNumeric } from '@modules/value-type'
import {
    headersMap,
    isVisualizationWithTimeDimension,
} from '@modules/visualization'
import type { InputType } from '@types'

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
}) => {
    const { adaptedVisualization, headers, parameters } =
        getAdaptedVisualization(visualization)

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
        .withDisplayProperty(displayProperty.toUpperCase())
        .withPageSize(pageSize)
        .withPage(page)
        .withIncludeMetadataDetails()

    // trackedEntity request can use multiple programs
    if (visualization.outputType !== 'TRACKED_ENTITY_INSTANCE') {
        req = req
            .withProgram(visualization.program.id)
            .withOutputType(visualization.outputType)
    }

    if (visualization.outputType === 'EVENT') {
        req = req.withStage(visualization.programStage?.id)
    }

    if (visualization.outputType === 'TRACKED_ENTITY_INSTANCE') {
        req = req.withTrackedEntityType(visualization.trackedEntityType.id)
    }

    if (relativePeriodDate && isVisualizationWithTimeDimension(visualization)) {
        req = req.withRelativePeriodDate(relativePeriodDate)
    }

    if (sortField) {
        switch (sortDirection) {
            case 'asc':
                req = req.withAsc(sortField)
                break
            case 'desc':
                req = req.withDesc(sortField)
                break
        }
    }

    const analyticsApiEndpoint = getAnalyticsEndpoint(visualization.outputType)

    const rawResponse = await analyticsEngine[analyticsApiEndpoint].getQuery(
        req
    )

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

const extractHeaders = (analyticsResponse, inputType: InputType) => {
    const defaultMetadata = getMainDimensions(inputType)

    const dimensionIds = analyticsResponse.headers.map((header) => {
        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: header.name,
            inputType,
        })
        const idMatch =
            Object.keys(headersMap).find(
                (key) => headersMap[key] === dimensionId
            ) ?? '' // XXX find a better solution

        const formattedDimensionId = getFullDimensionId({
            dimensionId: [
                'ou',
                'programStatus',
                'eventStatus',
                'createdBy',
                'lastUpdatedBy',
                'lastUpdated',
                'created',
            ].includes(idMatch)
                ? idMatch
                : dimensionId,
            programStageId,
            programId,
            inputType,
        })

        if (
            (idMatch === 'ou' &&
                (programId || inputType !== 'TRACKED_ENTITY_INSTANCE')) ||
            ['programStatus', 'eventStatus'].includes(idMatch)
            // org unit only if there's a programId or not tracked entity: this prevents pid.ou from being mixed up with just ou in TE
            // program status + event status in all cases
        ) {
            defaultMetadata[formattedDimensionId] = getProgramDimensions(
                programId ?? '' // XXX find a better solution
            )[formattedDimensionId]
        }

        return formattedDimensionId
    })

    const metadata = { ...analyticsResponse.metaData.items, ...defaultMetadata }

    const dimensionsWithSuffix = getDimensionsWithSuffix({
        dimensionIds,
        metadata,
        inputType,
    })

    const labels = dimensionsWithSuffix.map(({ name, suffix, id }) => ({
        id,
        label: suffix ? `${name}, ${suffix}` : name,
    }))

    const headers = analyticsResponse.headers.map((header, index) => {
        const result = { ...header, index }
        const { dimensionId, programId, programStageId } = getDimensionIdParts({
            id: header.name,
            inputType,
        })

        const idMatch =
            Object.keys(headersMap).find(
                (key) => headersMap[key] === dimensionId
            ) ?? '' // XXX find a better solution

        result.column =
            labels.find(
                (label) =>
                    label.id ===
                    getFullDimensionId({
                        dimensionId: [
                            'ou',
                            'programStatus',
                            'eventStatus',
                            'createdBy',
                            'lastUpdatedBy',
                            'lastUpdated',
                            'created',
                        ].includes(idMatch)
                            ? idMatch
                            : dimensionId,
                        programId,
                        programStageId,
                        inputType,
                    })
            )?.label || result.column

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

const useLineListAnalyticsData = ({
    visualization,
    filters,
    isVisualizationLoading: isGlobalLoading,
    displayProperty,
    onResponsesReceived,
    pageSize,
    page,
    sortField,
    sortDirection,
}) => {
    const dataEngine = useDataEngine()
    const [analyticsEngine] = useState(() => Analytics.getAnalytics(dataEngine))
    const mounted = useRef(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [fetching, setFetching] = useState<boolean>(true)
    const [error, setError] = useState<string | undefined>(undefined)
    const [data, setData] = useState<object | null>(null)
    const relativePeriodDate = filters?.relativePeriodDate

    const doFetch = useCallback(async () => {
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
            const headers = extractHeaders(
                analyticsResponse,
                visualization.outputType
            )
            const rows = extractRows(analyticsResponse, headers)
            const rowContext = extractRowContext(analyticsResponse)
            const pager = analyticsResponse.metaData.pager
            console.log('analyticsResponse', analyticsResponse)

            const legendSetIds: string[] = [] // XXX check this type
            const headerLegendSetMap: Record<string, string> = headers.reduce(
                (acc, header) => {
                    const metadataItem =
                        analyticsResponse.metaData.items[header.name]
                    if (typeof metadataItem?.legendSet === 'string') {
                        acc[header.name] = metadataItem.legendSet
                    }
                    return acc
                },
                {}
            )
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
                    .filter((header) => isValueTypeNumeric(header.valueType))
                    .forEach((header) => {
                        switch (visualization.legend.strategy) {
                            case 'FIXED':
                                header.legendSet = legendSets[0]
                                break
                            case 'BY_DATA_ITEM': {
                                header.legendSet = legendSets.find(
                                    (legendSet) =>
                                        legendSet.id ===
                                        headerLegendSetMap[header.name]
                                )
                                break
                            }
                        }
                    })
            }

            if (mounted.current) {
                setError(undefined)
                setData({ headers, rows, pager, rowContext })
            }

            onResponsesReceived(analyticsResponse)
        } catch (error) {
            if (mounted.current) {
                setError(error)
            }
        } finally {
            if (mounted.current) {
                setLoading(false)
                setFetching(false)
            }
        }
    }, [
        analyticsEngine,
        dataEngine,
        displayProperty,
        relativePeriodDate,
        visualization,
        page,
        pageSize,
        sortDirection,
        sortField,
        onResponsesReceived,
    ])

    useEffect(() => {
        /*
         * Hack to prevent state updates on unmounted components
         * needed because the analytics engine cannot cancel requests
         */
        mounted.current = true

        return () => {
            mounted.current = false
        }
    }, [])

    useEffect(() => {
        setFetching(true)
        doFetch()
    }, [
        dataEngine,
        displayProperty,
        visualization,
        page,
        pageSize,
        sortField,
        sortDirection,
        relativePeriodDate,
        doFetch,
        onResponsesReceived,
    ])

    useEffect(() => {
        // Do a full reset when loading a new visualization
        if (isGlobalLoading) {
            setFetching(false)
            setLoading(false)
            setError(undefined)
            setData(null)
        }
    }, [isGlobalLoading])

    return {
        loading,
        fetching,
        error,
        data,
        isGlobalLoading,
    }
}

export { useLineListAnalyticsData }
