import { WIRE_ONLY_DIMENSIONS } from '@modules/dimension'
import type {
    Axis,
    CurrentVisualization,
    DimensionArray,
    OutputType,
} from '@types'
import { getRequestOptions } from './query-tools-common'

const convertToScreamingSnakeCase = (input: string) =>
    input.replaceAll(/[A-Z]/g, (c) => `_${c}`).toUpperCase()

const adaptDimensions = (
    dimensions: DimensionArray,
    outputType: OutputType
) => {
    const adaptedDimensions: DimensionArray = []

    // This function should accommodate the various dimension cases and exceptions detailed in the Analytics apis spreadsheet

    dimensions.forEach((dimensionObj) => {
        const dimensionId = dimensionObj.dimension

        console.log('adapt dim', dimensionId)

        // these are always passed without any prefix
        if (['completed', 'created', 'lastUpdated'].includes(dimensionId)) {
            adaptedDimensions.push({
                ...dimensionObj,
                dimension: convertToScreamingSnakeCase(dimensionId),
                program: undefined,
                programStage: undefined,
            })
            // eventDate, eventStatus and sheduledDate have a program or stage id prefixed
        } else if (
            ['eventDate', 'eventStatus', 'scheduledDate'].includes(dimensionId)
        ) {
            adaptedDimensions.push({
                ...dimensionObj,
                dimension: convertToScreamingSnakeCase(dimensionId),
                program: undefined,
            })
        } else if (
            dimensionId === 'programStatus' ||
            dimensionId === 'enrollmentDate' ||
            dimensionId === 'incidentDate'
        ) {
            const dimension = convertToScreamingSnakeCase(dimensionId)

            // remove program/programStage for these dimensions
            adaptedDimensions.push({
                ...dimensionObj,
                dimension,
                program: undefined,
                programStage: undefined,
            })
        } else if (dimensionId === 'ou') {
            // ou must be passed as ENROLLMENT_OU for EVENT
            // program prefix must be removed for EVENT/ENROLLMENT
            // programStage must be passed when present (enrollment ou)
            adaptedDimensions.push({
                ...dimensionObj,
                dimension:
                    outputType === 'EVENT' && !dimensionObj.programStage?.id
                        ? 'ENROLLMENT_OU'
                        : 'ou',
                program: undefined,
            })
        } else if (
            // "dy, latitude, longitude" dimensions can be present in PT visualizations
            // everything else is a normal dimension id with programStage prefix
            !WIRE_ONLY_DIMENSIONS.has(dimensionId)
        ) {
            adaptedDimensions.push({
                ...dimensionObj,
                program: undefined,
            })
        }
    })

    return adaptedDimensions
}

export const getAdaptedVisualization = (
    visualization: CurrentVisualization
): {
    adaptedVisualization: Record<Axis, object[]> & {
        outputType: OutputType
    }
    parameters: object
} => {
    const outputType = visualization.outputType

    const parameters = getRequestOptions(visualization)

    const columns = visualization.columns ?? []
    const rows = visualization.rows ?? []
    const filters = visualization.filters ?? []

    const adaptedColumns = adaptDimensions(columns, outputType)
    const adaptedRows = adaptDimensions(rows, outputType)
    const adaptedFilters = adaptDimensions(filters, outputType)

    return {
        adaptedVisualization: {
            columns: adaptedColumns,
            rows: adaptedRows,
            filters: adaptedFilters,
            outputType: outputType,
        },
        parameters,
    }
}
