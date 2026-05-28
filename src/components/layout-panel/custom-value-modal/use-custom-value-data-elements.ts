import { NUMERIC_VALUE_TYPES } from '@constants/value-types'
import {
    useAppSelector,
    useCurrentUser,
    useMetadataStore,
    useProgramIds,
    useProgramStageIds,
    useRtkQuery,
} from '@hooks'
import { getVisUiConfigCustomValue } from '@store/vis-ui-config-slice'
import type { AggregationType } from '@types'
import { useMemo } from 'react'

/* Shape returned by /api/analytics/events/query/dimensions.
 * The `id` is a compound `stageId.deUid` qualifier. */
type DataElementDimension = {
    id: string
    name: string
    aggregationType: AggregationType
    dimensionType: 'DATA_ELEMENT'
}

export type CustomValueDataElement = DataElementDimension & {
    stageName?: string
}

const getStageIdFromDimensionId = (id: string | undefined): string | null => {
    if (!id) {
        return null
    }
    const idParts = id.split('.')
    return idParts.length === 2 ? idParts[0] : null
}

export const useCustomValueDataElements = () => {
    const {
        settings: { displayNameProperty },
    } = useCurrentUser()
    const metadataStore = useMetadataStore()
    const programIds = useProgramIds()
    const programStageIds = useProgramStageIds()
    const customValue = useAppSelector(getVisUiConfigCustomValue)

    if (programIds.length !== 1) {
        throw new Error(
            `useCustomValueDataElements requires exactly one program in the layout, got ${programIds.length}`
        )
    }
    if (programStageIds.length > 1) {
        throw new Error(
            `useCustomValueDataElements requires at most one program stage in the layout, got ${programStageIds.length}`
        )
    }

    const programId = programIds[0]
    const layoutStageId = programStageIds[0] ?? null

    let filteredByStageName: string | undefined
    let customValueStageMismatch = false
    if (layoutStageId) {
        const stage = metadataStore.getProgramStageMetadataItem(layoutStageId)
        if (!stage) {
            throw new Error(
                `Could not find stage with ID "${layoutStageId}" in the metadata store`
            )
        }
        filteredByStageName = stage.name

        const customValueStageId = getStageIdFromDimensionId(customValue?.id)
        customValueStageMismatch = Boolean(
            customValueStageId && customValueStageId !== layoutStageId
        )
    }

    const { data, ...queryResult } = useRtkQuery<{
        dimensions: DataElementDimension[]
    }>({
        resource: 'analytics/enrollments/aggregate/dimensions',
        params: {
            programId,
            fields: `id,${displayNameProperty}~rename(name),aggregationType,dimensionType`,
            filter: [
                'dimensionType:eq:DATA_ELEMENT',
                `valueType:in:[${NUMERIC_VALUE_TYPES.join(',')}]`,
            ],
            paging: false,
        },
    })

    const dataElements = useMemo<CustomValueDataElement[] | undefined>(() => {
        if (!data) {
            return undefined
        }

        if (layoutStageId) {
            return data.dimensions.filter(
                (dim) => getStageIdFromDimensionId(dim.id) === layoutStageId
            )
        }

        return data.dimensions.map((dim) => {
            const stageId = getStageIdFromDimensionId(dim.id)
            if (!stageId) {
                return dim
            }
            const stage = metadataStore.getProgramStageMetadataItem(stageId)
            if (!stage) {
                throw new Error(
                    `Could not find stage with ID "${stageId}" in the metadata store`
                )
            }
            return { ...dim, stageName: stage.name }
        })
    }, [data, layoutStageId, metadataStore])

    return {
        ...queryResult,
        dataElements,
        filteredByStageName,
        customValueStageMismatch,
    }
}
