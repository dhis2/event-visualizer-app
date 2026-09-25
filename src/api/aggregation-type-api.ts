import { api } from '@api/api'
import type { BaseQueryApiWithExtraArg } from '@api/custom-base-query'
import { parseEngineError } from '@api/parse-engine-error'
import { extractPlainDimensionId } from '@modules/dimension/ids'
import type { AggregationType, DimensionType } from '@types'

type GetAggregationTypeByDimensionQueryArgs = {
    dimensionType: DimensionType
    dimensionId: string
}

const resourceByDimensionType: Partial<Record<DimensionType, string>> = {
    DATA_ELEMENT: 'dataElements',
    PROGRAM_ATTRIBUTE: 'trackedEntityAttributes',
}

export const aggregationTypeApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getAggregationTypeByDimension: builder.query<
            AggregationType | null,
            GetAggregationTypeByDimensionQueryArgs
        >({
            async queryFn(
                { dimensionType, dimensionId },
                apiArg: BaseQueryApiWithExtraArg
            ) {
                const { engine, metadataStore } = apiArg.extra

                const resource = resourceByDimensionType[dimensionType]

                if (!resource) {
                    return { data: null }
                }

                const id =
                    metadataStore.getDimensionMetadataItem(dimensionId)
                        ?.dimensionId ?? extractPlainDimensionId(dimensionId)

                try {
                    const response = (await engine.query({
                        item: {
                            resource,
                            id,
                            params: { fields: 'aggregationType' },
                        },
                    })) as { item?: { aggregationType?: AggregationType } }

                    return { data: response.item?.aggregationType ?? null }
                } catch (error) {
                    return { error: parseEngineError(error) }
                }
            },
        }),
    }),
})
