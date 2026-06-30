import {
    ENROLLMENT_SCOPED_DIMENSION_IDS,
    REPETITION_INDEX_PATTERN,
} from '@modules/dimension/ids'
import {
    toAppLocalDimensions,
    transformDimensions,
} from '@modules/dimension/translation'
import type { CurrentVisualization, DimensionId, OutputType } from '@types'

export const headersMap: Record<DimensionId, string> = {
    ou: 'ouname',
    programStatus: 'programstatus',
    eventStatus: 'eventstatus',
    completed: 'completed',
    created: 'created',
    createdBy: 'createdbydisplayname',
    lastUpdatedBy: 'lastupdatedbydisplayname',
    eventDate: 'eventdate',
    enrollmentDate: 'enrollmentdate',
    enrollmentOu: 'enrollmentouname',
    incidentDate: 'incidentdate',
    scheduledDate: 'scheduleddate',
    lastUpdated: 'lastupdated',
}

export const getHeadersMap = (
    visualization: CurrentVisualization
): Record<DimensionId, string> => {
    const { outputType, showHierarchy, type } = visualization

    const map = Object.assign({}, headersMap)

    if (type === 'PIVOT_TABLE') {
        map['ou'] = 'ou'
        map['enrollmentOu'] = outputType === 'EVENT' ? 'enrollmentou' : 'ou'
    } else if (showHierarchy) {
        map['ou'] = 'ounamehierarchy'
    } else if (outputType === 'ENROLLMENT') {
        map['enrollmentOu'] = 'ouname'
    }

    return map
}

/* Static reverse of headersMap. The ENR `enrollmentOu → ouname` override
 * is not reversed here — bare `ouname` is ambiguous (stage event OU vs
 * enrollment OU) and is disambiguated by prefix presence + outputType. */
const reversedHeadersMap: Record<string, string> = {
    ...Object.entries(headersMap).reduce<Record<string, string>>(
        (acc, [appLocal, wire]) => {
            acc[wire] = appLocal
            return acc
        },
        {}
    ),
    ounamehierarchy: 'ou',
}

/* Wire response header → canonical app-local dimension ID (store key). */
export const analyticsHeaderToCanonicalDimensionId = (
    headerName: string,
    visualization: CurrentVisualization
): string => {
    const { outputType } = visualization

    const lastDotIndex = headerName.lastIndexOf('.')
    const prefix =
        lastDotIndex === -1
            ? undefined
            : headerName
                  .slice(0, lastDotIndex)
                  .replace(REPETITION_INDEX_PATTERN, '')
    const wireDim =
        lastDotIndex === -1 ? headerName : headerName.slice(lastDotIndex + 1)

    const appLocalDim = reversedHeadersMap[wireDim] ?? wireDim

    if (prefix) {
        return `${prefix}.${appLocalDim}`
    }

    if (outputType === 'TRACKED_ENTITY_INSTANCE') {
        const tetId = visualization.trackedEntityType?.id
        if (tetId && appLocalDim === 'ou') {
            return `${tetId}.enrollmentOu`
        }
        return appLocalDim
    }

    const programId = visualization.programDimensions?.[0]?.id

    if (outputType === 'ENROLLMENT' && appLocalDim === 'ou' && programId) {
        return `${programId}.enrollmentOu`
    }

    if (ENROLLMENT_SCOPED_DIMENSION_IDS.has(appLocalDim) && programId) {
        return `${programId}.${appLocalDim}`
    }

    return appLocalDim
}

/* Built-in dimension IDs sent in the analytics request `dimension=` param
 * as SCREAMING_SNAKE_CASE. Everything else (UIDs, `ou`) goes verbatim. */
const SCREAMING_SNAKE_REQUEST_DIMENSION_IDS: ReadonlySet<string> = new Set([
    'eventDate',
    'scheduledDate',
    'eventStatus',
    'enrollmentOu',
    'enrollmentDate',
    'incidentDate',
    'programStatus',
    'lastUpdated',
    'created',
    'completed',
])

const toRequestDimensionWireName = (dimensionId: string): string =>
    SCREAMING_SNAKE_REQUEST_DIMENSION_IDS.has(dimensionId)
        ? dimensionId.replaceAll(/[A-Z]/g, (c) => `_${c}`).toUpperCase()
        : dimensionId

type DimensionContext = {
    dimensionId: string
    programId?: string
    programStageId?: string
    trackedEntityTypeId?: string
}

/* Canonical dimension → analytics request `?dimension=` wire string. */
export const getAnalyticsRequestDimensionName = ({
    dimensionId,
    programId,
    programStageId,
    trackedEntityTypeId,
    outputType,
}: DimensionContext & { outputType: OutputType }): string => {
    if (programStageId) {
        return `${programStageId}.${toRequestDimensionWireName(dimensionId)}`
    }

    if (trackedEntityTypeId && !programId) {
        if (dimensionId === 'enrollmentOu') {
            return 'ou'
        }
        return toRequestDimensionWireName(dimensionId)
    }

    if (programId && outputType === 'TRACKED_ENTITY_INSTANCE') {
        return `${programId}.${toRequestDimensionWireName(dimensionId)}`
    }

    if (outputType === 'ENROLLMENT' && dimensionId === 'enrollmentOu') {
        return 'ou'
    }

    return toRequestDimensionWireName(dimensionId)
}

/* Canonical dimension → analytics request `?headers=` wire string, which
 * the engine echoes back as the response header `name`. Same prefix rules
 * as getAnalyticsRequestDimensionName; dim name comes from getHeadersMap. */
export const getAnalyticsRequestHeaderName = ({
    dimensionId,
    programId,
    programStageId,
    trackedEntityTypeId,
    visualization,
}: DimensionContext & {
    visualization: CurrentVisualization
}): string => {
    const { outputType } = visualization
    const map = getHeadersMap(visualization)
    const wireDim = map[dimensionId as DimensionId] ?? dimensionId

    if (programStageId) {
        return `${programStageId}.${wireDim}`
    }

    if (trackedEntityTypeId && !programId) {
        if (dimensionId === 'enrollmentOu') {
            return 'ouname'
        }
        return wireDim
    }

    if (programId && outputType === 'TRACKED_ENTITY_INSTANCE') {
        return `${programId}.${wireDim}`
    }

    return wireDim
}

/**
 * Transforms a canonical CurrentVisualization into the shape needed for
 * analytics requests and rendering. Applies wire-to-app dimension transforms
 * (PROGRAM_DATA_ELEMENT → DATA_ELEMENT, strip dy/latitude/longitude) and
 * converts the completedOnly option into an eventStatus filter.
 *
 * Legacy normalisation (pe → time dim, orgUnitField, timeField, top-level
 * program/programStage) is NOT this function's concern — that's handled
 * upstream by normalizeApiSavedVisualization at load time.
 */
export const transformVisualizationForAnalyticsRequest = (
    visualization: CurrentVisualization
): CurrentVisualization => {
    const columns = toAppLocalDimensions(
        transformDimensions(visualization.columns ?? [])
    )
    const rows = toAppLocalDimensions(
        transformDimensions(visualization.rows ?? [])
    )
    const filters = toAppLocalDimensions(
        transformDimensions(visualization.filters ?? [])
    )

    if (visualization.completedOnly && visualization.outputType === 'EVENT') {
        filters.push({
            dimension: 'eventStatus',
            items: [{ id: 'COMPLETED' }],
        })
    }

    return {
        ...visualization,
        columns,
        rows,
        filters,
    }
}
