import { NUMERIC_VALUE_TYPES } from '@constants/value-types'
import { useCurrentUser, useMetadataStore, useRtkQuery } from '@hooks'
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

const getStageIdFromDimensionId = (id: string): string | null => {
    const idParts = id.split('.')
    return idParts.length === 2 ? idParts[0] : null
}

const compareByName = (a: CustomValueDimension, b: CustomValueDimension) =>
    a.name.localeCompare(b.name)

export const useCellValueItems = (programId: string) => {
    const {
        settings: { displayNameProperty },
    } = useCurrentUser()
    const metadataStore = useMetadataStore()

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

    const program = metadataStore.getProgramMetadataItemOrThrow(programId)
    const programHasMultipleStages = (program.programStages?.length ?? 0) > 1
    const tetName = program.trackedEntityType?.name

    const items = useMemo<CustomValueItem[] | undefined>(() => {
        if (!data) {
            return undefined
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
                const stage =
                    metadataStore.getProgramStageMetadataItemOrThrow(stageId)
                return { ...dim, stageName: stage.name }
            })
            .sort(compareByName)
    }, [data, metadataStore, programHasMultipleStages, tetName])

    return { ...queryResult, items }
}
