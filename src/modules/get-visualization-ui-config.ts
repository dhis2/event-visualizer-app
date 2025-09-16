import { convertToSupportedVisType } from '@constants/visualization-types'
import type { SupportedVisType } from '@constants/visualization-types'
import {
    layoutGetAxisIdDimensionIdsObject,
    layoutGetDimensionIdItemIdsObject,
} from '@dhis2/analytics'
import { getFullDimensionId } from '@modules/dimension'
import type { CurrentVisualization, InputType } from '@types'

const getConditionsFromVisualization = (
    vis: CurrentVisualization,
    inputType: InputType
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
            inputType,
        })
        result[dimensionId] = {
            condition: item.filter,
            legendSet: item.legendSet?.id,
        }
    }

    return result
}

const getVisualizationLayout = (layout, type: SupportedVisType) => {
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
    const inputType = vis.outputType // The single location where outputType is renamed to inputType
    const supportedVisType = convertToSupportedVisType(vis.type) // TODO remove this and override type in Visualization type definition

    return {
        visualizationType: supportedVisType,
        inputType,
        layout: getVisualizationLayout(
            layoutGetAxisIdDimensionIdsObject(vis),
            supportedVisType
        ),
        itemsByDimension: layoutGetDimensionIdItemIdsObject(vis),
        conditionsByDimension: getConditionsFromVisualization(vis, inputType),
    }
}
