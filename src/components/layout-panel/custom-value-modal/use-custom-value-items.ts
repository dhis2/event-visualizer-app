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

/* Data element ids are compound `stageId.deUid` qualifiers; tracked entity
 * attributes are program scoped and carry a plain uid with no stage prefix. */
type CustomValueDimension = {
    id: string
    name: string
    aggregationType: AggregationType
    dimensionType: 'DATA_ELEMENT' | 'PROGRAM_ATTRIBUTE'
}

export type CustomValueItem = CustomValueDimension & {
    stageName?: string
}

export const getStageIdFromDimensionId = (
    id: string | undefined
): string | null => {
    if (!id) {
        return null
    }
    const idParts = id.split('.')
    return idParts.length === 2 ? idParts[0] : null
}

const compareByName = (a: CustomValueDimension, b: CustomValueDimension) =>
    a.name.localeCompare(b.name)

export const useCustomValueItems = () => {
    const {
        settings: { displayNameProperty },
    } = useCurrentUser()
    const metadataStore = useMetadataStore()
    const programIds = useProgramIds()
    const programStageIds = useProgramStageIds()
    const customValue = useAppSelector(getVisUiConfigCustomValue)

    if (programIds.length !== 1) {
        throw new Error(
            `useCustomValueItems requires exactly one program in the layout, got ${programIds.length}`
        )
    }
    if (programStageIds.length > 1) {
        throw new Error(
            `useCustomValueItems requires at most one program stage in the layout, got ${programStageIds.length}`
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
        dimensions: CustomValueDimension[]
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
    const tetName = program.trackedEntityType?.name

    const items = useMemo<CustomValueItem[] | undefined>(() => {
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
                .map((dim) =>
                    dim.dimensionType === 'PROGRAM_ATTRIBUTE' && tetName
                        ? { ...dim, stageName: tetName }
                        : dim
                )
                .sort(compareByName)
        }

        return data.dimensions
            .map((dim) => {
                if (dim.dimensionType === 'PROGRAM_ATTRIBUTE') {
                    return tetName ? { ...dim, stageName: tetName } : dim
                }
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
            .sort(compareByName)
    }, [data, layoutStageId, metadataStore, programHasMultipleStages, tetName])

    return {
        ...queryResult,
        items,
        filteredByStageName,
        customValueStageMismatch,
    }
}
