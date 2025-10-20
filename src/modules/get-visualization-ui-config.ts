import {
    layoutGetAxisIdDimensionIdsObject,
    layoutGetDimensionIdItemIdsObject,
} from '@dhis2/analytics'
import { getFullDimensionId } from '@modules/dimension'
import type {
    CurrentVisualization,
    OutputType,
    VisualizationType,
} from '@types'

const getConditionsFromVisualization = (
    vis: CurrentVisualization,
    outputType: OutputType
): Record<string, { condition?: string; legendSet?: string }> => {
    const result: Record<string, { condition?: string; legendSet?: string }> =
        {}

    const columns = vis.columns ?? []
    const rows = vis.rows ?? []
    const filters = vis.filters ?? []

    const items = [...columns, ...rows, ...filters].filter(
        (item) => item.filter || item.legendSet
    )

    for (const item of items) {
        const dimensionId = getFullDimensionId({
            dimensionId: item.dimension,
            programId: item.program?.id,
            programStageId: item.programStage?.id,
            outputType,
        })
        result[dimensionId] = {
            condition: item.filter,
            legendSet: item.legendSet?.id,
        }
    }

    return result
}

const getVisualizationLayout = (layout, type: VisualizationType) => {
    if (type === 'LINE_LIST') {
        return {
            columns: [...layout.columns, ...(layout.rows || [])],
            rows: [],
            filters: [...layout.filters],
        }
    }

    return layout
}

export const getVisualizationUiConfig = (vis: CurrentVisualization) => {
    return {
        visualizationType: vis.type,
        outputType: vis.outputType,
        layout: getVisualizationLayout(
            layoutGetAxisIdDimensionIdsObject(vis),
            vis.type
        ),
        itemsByDimension: layoutGetDimensionIdItemIdsObject(vis),
        conditionsByDimension: getConditionsFromVisualization(
            vis,
            vis.outputType
        ),
    }
}
