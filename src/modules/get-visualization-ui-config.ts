import type { SupportedInputType } from '@constants/input-types'
import {
    convertToSupportedVisType,
    type SupportedVisType,
} from '@constants/visualization-types'
import {
    layoutGetAxisIdDimensionIdsObject,
    layoutGetDimensionIdItemIdsObject,
} from '@dhis2/analytics'
import type { SavedVisualization } from '@types'

interface GetFullDimensionIdParams {
    dimensionId: string
    programId?: string
    programStageId?: string
    inputType: SupportedInputType
}

const getFullDimensionId = ({
    dimensionId,
    programId,
    programStageId,
    inputType,
}: GetFullDimensionIdParams): string => {
    return [
        inputType === 'TRACKED_ENTITY_INSTANCE' ? programId : undefined,
        programStageId,
        dimensionId,
    ]
        .filter((p) => p)
        .join('.')
}

const getConditionsFromVisualization = (
    vis: SavedVisualization,
    inputType: SupportedInputType
): Record<string, { condition?: string; legendSet?: string }> => {
    const result: Record<string, { condition?: string; legendSet?: string }> =
        {}
    const items = [...vis.columns, ...vis.rows, ...vis.filters].filter(
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

export const getVisualizationUiConfig = (vis: SavedVisualization) => {
    const inputType = vis.outputType // The single location where outputType is renamed to inputType
    const supportedVisType = convertToSupportedVisType(vis.type)
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
