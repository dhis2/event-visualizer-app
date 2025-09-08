import type { InputType } from '@constants/input-types'
import type { SupportedVisType } from '@constants/visualization-types'
import {
    layoutGetAxisIdDimensionIdsObject,
    layoutGetDimensionIdItemIdsObject,
} from '@dhis2/analytics'

interface GetFullDimensionIdParams {
    dimensionId: string
    programId?: string
    programStageId?: string
    inputType: InputType
}

// LL code formatDimensionId
const getFullDimensionId = ({
    dimensionId,
    programId,
    programStageId,
    inputType,
}: GetFullDimensionIdParams): string => {
    return [
        inputType === 'TRACKED_ENTITY' ? programId : undefined,
        programStageId,
        dimensionId,
    ]
        .filter((p) => p)
        .join('.')
}

const getConditionsFromVisualization = (vis) =>
    [...vis.columns, ...vis.rows, ...vis.filters]
        .filter((item) => item.filter || item.legendSet)
        .reduce(
            (acc, key) => ({
                ...acc,
                [getFullDimensionId({
                    dimensionId: key.dimension,
                    programId: key.program?.id,
                    programStageId: key.programStage?.id,
                    inputType: vis.inputType,
                })]: {
                    condition: key.filter,
                    legendSet: key.legendSet?.id,
                },
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

export const getVisualizationConfig = (vis) => {
    console.log('getVisualizationConfig vis:', vis)
    const axisDimensionIdsObj = layoutGetAxisIdDimensionIdsObject(vis)
    console.log(
        'getVisualizationConfig axisDimensionIdsObj:',
        axisDimensionIdsObj
    )
    const cfg = {
        visualizationType: vis.type,
        inputType: vis.outputType, // The single location where outputType is renamed to inputType
        layout: getVisualizationLayout(axisDimensionIdsObj, vis.type),
        itemsByDimension: layoutGetDimensionIdItemIdsObject(vis),
        conditionsByDimension: getConditionsFromVisualization(vis),
    }
    console.log('getVisualizationConfig cfg:', cfg)

    return cfg
}
