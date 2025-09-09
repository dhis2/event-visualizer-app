import type { SupportedInputType } from '@constants/input-types'
import type { SupportedVisType } from '@constants/visualization-types'
import {
    layoutGetAxisIdDimensionIdsObject,
    layoutGetDimensionIdItemIdsObject,
} from '@dhis2/analytics'

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

const getConditionsFromVisualization = (vis, inputType) =>
    [...vis.columns, ...vis.rows, ...vis.filters]
        .filter((item) => item.filter || item.legendSet)
        .reduce(
            (acc, key) => ({
                const dimensionId = getFullDimensionId({
                    dimensionId: key.dimension,
                    programId: key.program?.id,
                    programStageId: key.programStage?.id,
                    inputType,
                })
                acc[dimensionId] = {
                    condition: key.filter,
                    legendSet: key.legendSet?.id,
                }
                return acc
            }),
            {}
        )

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

export const getVisualizationUiConfig = (vis) => {
    const inputType = vis.outputType // The single location where outputType is renamed to inputType
    return {
        visualizationType: vis.type,
        inputType,
        layout: getVisualizationLayout(
            layoutGetAxisIdDimensionIdsObject(vis),
            vis.type
        ),
        itemsByDimension: layoutGetDimensionIdItemIdsObject(vis),
        conditionsByDimension: getConditionsFromVisualization(vis, inputType),
    }
}
