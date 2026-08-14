import { api } from '@api/api'
import type { BaseQueryApiWithExtraArg } from '@api/custom-base-query'
import { parseEngineError } from '@api/parse-engine-error'
import { extractPlainDimensionId } from '@modules/dimension/ids'
import type {
    DimensionType,
    LegendSetMetadataItem,
    MetadataInputMap,
} from '@types'

type GetLegendSetsByDimensionQueryArgs = {
    dimensionType: DimensionType
    dimensionId: string
}

const resourceByDimensionType: Partial<Record<DimensionType, string>> = {
    DATA_ELEMENT: 'dataElements',
    PROGRAM_ATTRIBUTE: 'trackedEntityAttributes',
    PROGRAM_INDICATOR: 'programIndicators',
}

/* Legends are contiguous value ranges, but come back in arbitrary order. They
 * are sorted once here rather than everywhere the groups are listed. */
const sortLegendsByStartValue = (
    legendSet: LegendSetMetadataItem
): LegendSetMetadataItem => ({
    ...legendSet,
    legends: [...legendSet.legends].sort((a, b) => a.startValue - b.startValue),
})

export const legendSetsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getLegendSetsByDimension: builder.query<
            LegendSetMetadataItem[],
            GetLegendSetsByDimensionQueryArgs
        >({
            async queryFn(
                { dimensionType, dimensionId },
                apiArg: BaseQueryApiWithExtraArg
            ) {
                const { engine, metadataStore } = apiArg.extra

                const resource = resourceByDimensionType[dimensionType]

                if (!resource) {
                    return { data: [] }
                }

                const storedDimension =
                    metadataStore.getDimensionMetadataItem(dimensionId)
                const id =
                    storedDimension?.dimensionId ??
                    extractPlainDimensionId(dimensionId)

                try {
                    const response = (await engine.query({
                        legendSets: {
                            resource,
                            id,
                            params: {
                                /* Legend sets and legends have no shortName, so
                                 * their names always come from displayName
                                 * regardless of the user's display property
                                 * setting. */
                                fields: 'legendSets[id,displayName~rename(name),legends[id,displayName~rename(name),startValue,endValue]]',
                            },
                        },
                    })) as {
                        legendSets?: { legendSets?: LegendSetMetadataItem[] }
                    }

                    const legendSets = (
                        response.legendSets?.legendSets ?? []
                    ).map(sortLegendsByStartValue)

                    if (legendSets.length) {
                        const metadataInput: MetadataInputMap = {}

                        for (const legendSet of legendSets) {
                            metadataInput[legendSet.id] = legendSet

                            /* Also stored individually, so a selected legend can
                             * be named from its ID alone — the layout chip
                             * tooltip has only the IDs held in the filter. */
                            for (const legend of legendSet.legends) {
                                metadataInput[legend.id] = legend
                            }
                        }

                        /* Recorded on the dimension so the grouping options can
                         * be resolved without refetching. Only for a dimension
                         * already in the store, since a partial item carries no
                         * name to create one with. */
                        if (storedDimension) {
                            metadataInput[dimensionId] = {
                                id: dimensionId,
                                dimensionType,
                                legendSetIds: legendSets.map(({ id }) => id),
                            }
                        }

                        metadataStore.addMetadata(metadataInput)
                    }

                    return { data: legendSets }
                } catch (error) {
                    return { error: parseEngineError(error) }
                }
            },
        }),
    }),
})
