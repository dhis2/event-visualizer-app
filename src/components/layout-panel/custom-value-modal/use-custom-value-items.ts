import { NUMERIC_VALUE_TYPES } from '@constants/value-types'
import {
    useCurrentUser,
    useLayoutContext,
    useMetadataStore,
    useRtkQuery,
} from '@hooks'
import { extractStageDimensionIdPrefix } from '@modules/dimension/ids'
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

const compareByName = (a: CustomValueDimension, b: CustomValueDimension) =>
    a.name.localeCompare(b.name)

/* Every numeric item in the program, whatever stage it belongs to: the cell
 * value applies across output types, so a stage the current layout doesn't use
 * is still a legitimate choice for an enrollment or tracked entity table. */
export const useCustomValueItems = () => {
    const {
        settings: { displayNameProperty },
    } = useCurrentUser()
    const metadataStore = useMetadataStore()
    const { programIds } = useLayoutContext()

    /* A tracked entity layout can span several programs, or none. Rather than
     * refusing to open, fall back to the first program's numeric items. */
    const programId = programIds[0]

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

    const program = programId
        ? metadataStore.getProgramMetadataItem(programId)
        : undefined
    const programHasMultipleStages = (program?.programStages?.length ?? 0) > 1
    const tetName = program?.trackedEntityType?.name

    const items = useMemo<CustomValueItem[] | undefined>(() => {
        if (!data) {
            return undefined
        }

        return data.dimensions
            .map((dim) => {
                if (dim.dimensionType === 'PROGRAM_ATTRIBUTE') {
                    return tetName ? { ...dim, stageName: tetName } : dim
                }
                const stageId = extractStageDimensionIdPrefix(dim.id)
                if (!stageId || !programHasMultipleStages) {
                    return dim
                }
                const stageName =
                    metadataStore.getProgramStageMetadataItem(stageId)?.name
                return stageName ? { ...dim, stageName } : dim
            })
            .sort(compareByName)
    }, [data, metadataStore, programHasMultipleStages, tetName])

    return { ...queryResult, items }
}
