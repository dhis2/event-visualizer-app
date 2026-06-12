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
 * For data elements the `id` is a compound `stageId.deUid` qualifier.
 * Program attributes are program-scoped, not stage-scoped, so their `id`
 * is the plain globally-unique attribute id with no stage prefix. */
type DataItemDimension = {
    id: string
    name: string
    aggregationType: AggregationType
    dimensionType: 'DATA_ELEMENT' | 'PROGRAM_ATTRIBUTE'
}

export type CustomValueDataElement = DataItemDimension & {
    stageName?: string
}

const getStageIdFromDimensionId = (id: string | undefined): string | null => {
    if (!id) {
        return null
    }
    const idParts = id.split('.')
    return idParts.length === 2 ? idParts[0] : null
}

const compareDataElementsThenAttributesByName = (
    a: DataItemDimension,
    b: DataItemDimension
) => {
    const aIsAttribute = a.dimensionType === 'PROGRAM_ATTRIBUTE'
    const bIsAttribute = b.dimensionType === 'PROGRAM_ATTRIBUTE'
    if (aIsAttribute !== bIsAttribute) {
        return aIsAttribute ? 1 : -1
    }
    return a.name.localeCompare(b.name)
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
        dimensions: DataItemDimension[]
    }>({
        resource: 'analytics/enrollments/aggregate/dimensions',
        params: {
            programId,
            fields: `id,${displayNameProperty}~rename(name),aggregationType,dimensionType`,
            filter: [
                'dimensionType:in:[DATA_ELEMENT,PROGRAM_ATTRIBUTE]',
                `valueType:in:[${NUMERIC_VALUE_TYPES.join(',')}]`,
            ],
            paging: false,
        },
    })

    const program = metadataStore.getProgramMetadataItem(programId)
    if (!program) {
        throw new Error(
            `Could not find program with ID "${programId}" in the metadata store`
        )
    }
    const programHasMultipleStages = (program.programStages?.length ?? 0) > 1

    const dataElements = useMemo<CustomValueDataElement[] | undefined>(() => {
        if (!data) {
            return undefined
        }

        if (layoutStageId) {
            return data.dimensions
                .filter(
                    (dim) =>
                        dim.dimensionType === 'PROGRAM_ATTRIBUTE' ||
                        getStageIdFromDimensionId(dim.id) === layoutStageId
                )
                .sort(compareDataElementsThenAttributesByName)
        }

        return data.dimensions
            .map((dim) => {
                const stageId = getStageIdFromDimensionId(dim.id)
                if (!stageId || !programHasMultipleStages) {
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
            .sort(compareDataElementsThenAttributesByName)
    }, [data, layoutStageId, metadataStore, programHasMultipleStages])

    return {
        ...queryResult,
        dataElements,
        filteredByStageName,
        customValueStageMismatch,
    }
}
