import { TIME_DIMENSION_IDS } from '@constants/dimensions'
import { USER_ORGUNIT } from '@constants/org-units'
import i18n from '@dhis2/d2-i18n'
import {
    getDefaultOrgUnitLabel,
    getDefaultOrgUnitMetadata,
} from '@modules/metadata'
import type {
    CurrentVisualization,
    DimensionArray,
    DimensionId,
    DimensionMetadataItem,
    DimensionRecord,
    DimensionType,
    OutputType,
    Program,
    ProgramStage,
    TimeDimensionId,
    ValueType,
    VisualizationType,
} from '@types'

export const outputTypeTimeDimensionMap: Record<OutputType, DimensionId> = {
    EVENT: 'eventDate',
    ENROLLMENT: 'enrollmentDate',
    TRACKED_ENTITY_INSTANCE: 'created',
}

/* Mapping from the UPPER_SNAKE_CASE enum values that `timeField` can hold
 * (backend source of truth: `TimeField.java` in dhis2-core) onto the
 * concrete time-dimension id the app uses internally. Used when
 * materialising a legacy `pe` dimension into a proper time dimension. */
export const timeFieldTimeDimensionMap: Record<string, DimensionId> = {
    COMPLETED_DATE: 'completedDate',
    CREATED: 'created',
    ENROLLMENT_DATE: 'enrollmentDate',
    EVENT_DATE: 'eventDate',
    INCIDENT_DATE: 'incidentDate',
    LAST_UPDATED: 'lastUpdated',
    /* OCCURRED_DATE is the newer tracker enum name for event date. Mapped
     * the same as EVENT_DATE; revisit if a semantic distinction emerges. */
    OCCURRED_DATE: 'eventDate',
    SCHEDULED_DATE: 'scheduledDate',
}

/* Full set of enum values the backend accepts for `timeField`. Derived from
 * the map keys so the two cannot drift. Any value outside this set is
 * treated by the backend as a custom data-element / attribute UID. */
export const KNOWN_TIME_FIELD_VALUES: ReadonlySet<string> = new Set(
    Object.keys(timeFieldTimeDimensionMap)
)

type GetDimensionIdPartsParams = {
    id: string
    outputType?: OutputType
}

export const getDimensionIdParts = ({
    id,
    outputType = undefined,
}: GetDimensionIdPartsParams): {
    dimensionId: string
    programStageId: string
    programId?: string
    repetitionIndex?: string
} => {
    let rawStageId
    const [dimensionId, part2, part3] = (id || '').split('.').reverse()
    let programId = part3
    if (part3 || outputType !== 'TRACKED_ENTITY_INSTANCE') {
        rawStageId = part2
    }
    if (outputType === 'TRACKED_ENTITY_INSTANCE' && !part3) {
        programId = part2
    }
    const [programStageId, repetitionIndex] = (rawStageId || '').split('[')
    return {
        dimensionId,
        programStageId,
        ...(programId ? { programId } : {}),
        repetitionIndex:
            repetitionIndex?.length &&
            repetitionIndex.substring(0, repetitionIndex.indexOf(']')),
    }
}

export const extractPlainDimensionId = (compoundId?: string | null): string =>
    (compoundId ?? '').split('.').pop()!

export const getDefaultItemsForDimension = (
    dimensionId: string
): string[] | undefined => {
    const plainId = extractPlainDimensionId(dimensionId)
    if (plainId === 'ou' || plainId === 'enrollmentOu') {
        return [USER_ORGUNIT]
    }
    return undefined
}

type GetFullDimensionIdParams = {
    dimensionId: string
    outputType?: OutputType
    programId?: string
    programStageId?: string
}

export const getFullDimensionId = ({
    dimensionId,
    programId,
    programStageId,
    outputType,
}: GetFullDimensionIdParams): string => {
    if (dimensionId === 'created') {
        return dimensionId
    } else if (
        outputType !== 'TRACKED_ENTITY_INSTANCE' &&
        [
            'completed',
            'enrollmentdate',
            'enrollmentouname',
            'incidenddate',
            'lastupdated',
            'programstatus',
        ].includes(dimensionId)
    ) {
        return dimensionId
    } else {
        return [
            outputType === 'TRACKED_ENTITY_INSTANCE' ? programId : undefined,
            programStageId,
            dimensionId,
        ]
            .filter(Boolean)
            .join('.')
    }
}

type DimensionRecordObject = Partial<Record<DimensionId, DimensionMetadataItem>>

export const getCreatedDimension = (): Partial<
    Record<DimensionId, DimensionMetadataItem>
> => ({
    created: {
        id: 'created',
        dimensionId: 'created',
        dimensionType: 'PERIOD',
        name: i18n.t('Registration date'),
        valueType: 'DATE',
    },
})

export const getMainDimensions = (
    outputType: OutputType
): DimensionRecordObject => ({
    ...(outputType === 'TRACKED_ENTITY_INSTANCE'
        ? {
              ...getDefaultOrgUnitMetadata(outputType),
              ...getCreatedDimension(),
          }
        : {}),
    lastUpdated: {
        id: 'lastUpdated',
        dimensionId: 'lastUpdated',
        dimensionType: 'PERIOD',
        name: i18n.t('Last updated on'),
        valueType: 'DATETIME',
    },
    createdBy: {
        id: 'createdBy',
        dimensionId: 'createdBy',
        dimensionType: 'USER',
        name: i18n.t('Created by'),
    },
    lastUpdatedBy: {
        id: 'lastUpdatedBy',
        dimensionId: 'lastUpdatedBy',
        dimensionType: 'USER',
        name: i18n.t('Last updated by'),
    },
})

const prefixDimensionId = (dimensionId: string, prefix?: string): string =>
    prefix ? `${prefix}.${dimensionId}` : dimensionId

export const getProgramDimensions = (
    programId?: string
): DimensionRecordObject => ({
    [prefixDimensionId('ou', programId)]: {
        id: prefixDimensionId('ou', programId),
        dimensionType: 'ORGANISATION_UNIT',
        name: getDefaultOrgUnitLabel(),
    },
    [prefixDimensionId('eventStatus', programId)]: {
        id: prefixDimensionId('eventStatus', programId),
        dimensionType: 'STATUS',
        name: i18n.t('Event status'),
    },
    [prefixDimensionId('programStatus', programId)]: {
        id: prefixDimensionId('programStatus', programId),
        dimensionType: 'STATUS',
        name: i18n.t('Program status'),
    },
})

/* Dimensions that exist only in the wire format (legacy event chart shape)
 * and have no meaning in the app-local layer. */
export const WIRE_ONLY_DIMENSIONS: ReadonlySet<string> = new Set([
    'dy',
    'latitude',
    'longitude',
])

export const transformDimensions = (
    dimensions: DimensionArray
): DimensionArray =>
    dimensions
        .filter(
            (dimensionObj) => !WIRE_ONLY_DIMENSIONS.has(dimensionObj.dimension)
        )
        .map((dimensionObj) => {
            if (dimensionObj.dimensionType === 'PROGRAM_DATA_ELEMENT') {
                return {
                    ...dimensionObj,
                    dimensionType: 'DATA_ELEMENT',
                }
            }
            return dimensionObj
        })

export const isTimeDimensionId = (
    dimensionId: DimensionRecord['dimension']
): dimensionId is TimeDimensionId =>
    (TIME_DIMENSION_IDS as readonly string[]).includes(dimensionId)

type NameParentProperty = 'program' | 'stage'
type TimeDimension = {
    id: TimeDimensionId
    dimensionType: DimensionType
    formatType: ValueType
    defaultName: string
    nameParentProperty: NameParentProperty
    nameProperty: string
}
export const getTimeDimensions = (): Record<
    Exclude<TimeDimensionId, 'created' | 'lastUpdated'>,
    TimeDimension
> => ({
    completedDate: {
        id: 'completedDate',
        dimensionType: 'PERIOD',
        defaultName: i18n.t('Completed date'),
        nameParentProperty: 'stage',
        nameProperty: 'displayCompletedDateLabel',
        formatType: 'DATE',
    },
    createdDate: {
        id: 'createdDate',
        dimensionType: 'PERIOD',
        defaultName: i18n.t('Created date'),
        nameParentProperty: 'stage',
        nameProperty: 'displayCreatedDateLabel',
        formatType: 'DATE',
    },
    eventDate: {
        id: 'eventDate',
        dimensionType: 'PERIOD',
        defaultName: i18n.t('Event date'),
        nameParentProperty: 'stage',
        nameProperty: 'displayExecutionDateLabel',
        formatType: 'DATE',
    },
    enrollmentDate: {
        id: 'enrollmentDate',
        dimensionType: 'PERIOD',
        defaultName: i18n.t('Enrollment date'),
        nameParentProperty: 'program',
        nameProperty: 'displayEnrollmentDateLabel',
        formatType: 'DATE',
    },
    incidentDate: {
        id: 'incidentDate',
        dimensionType: 'PERIOD',
        defaultName: i18n.t('Incident date'),
        nameParentProperty: 'program',
        nameProperty: 'displayIncidentDateLabel',
        formatType: 'DATE',
    },
    lastUpdatedOn: {
        id: 'lastUpdatedOn',
        dimensionType: 'PERIOD',
        defaultName: i18n.t('Last updated on'),
        nameParentProperty: 'stage',
        nameProperty: 'displayLastUpdatedOnLabel',
        formatType: 'DATE',
    },
    scheduledDate: {
        id: 'scheduledDate',
        dimensionType: 'PERIOD',
        defaultName: i18n.t('Scheduled date'),
        nameParentProperty: 'stage',
        nameProperty: 'displayDueDateLabel',
        formatType: 'DATE',
    },
})

export const getTimeDimensionName = (
    dimension: TimeDimension,
    program?: Program,
    stage?: ProgramStage
): string => {
    if (!dimension.nameParentProperty || !program) {
        return dimension.defaultName
    }
    const name =
        dimension.nameParentProperty === 'program'
            ? program[dimension.nameProperty]
            : stage?.[dimension.nameProperty]

    return name || dimension.defaultName
}

export const getUiDimensionType = (
    dimensionId: DimensionId | string,
    dimensionType: DimensionType | 'PROGRAM_DATA_ELEMENT'
): DimensionType => {
    if (dimensionType === 'PROGRAM_DATA_ELEMENT') {
        return 'DATA_ELEMENT'
    }
    switch (dimensionId) {
        case 'programStatus':
        case 'eventStatus':
            return 'STATUS'

        case 'createdBy':
        case 'lastUpdatedBy':
            return 'USER'

        default:
            return dimensionType
    }
}

export const combineAllDimensionsFromVisualization = (
    visualization: CurrentVisualization
): DimensionArray => [
    ...(visualization.columns || []),
    ...(visualization.rows || []),
    ...(visualization.filters || []),
]

/* ---------------------------------------------------------------------------
 * Dimension ID translation between API and app-local layers.
 *
 * SavedVisualization/CurrentVisualization use API dimension IDs (e.g. `ou`
 * for enrollment org unit). The app-local layer (visUiConfig, metadata store)
 * uses distinct IDs (e.g. `enrollmentOu`). These functions translate at the
 * boundary.
 * --------------------------------------------------------------------------- */

/* Dimension types that are not bound to any program or stage. The backend
 * may still populate program/programStage on these in legacy visualizations;
 * drop those fields at the API → app-local boundary so that downstream code
 * (compound ID, save round-trip) treats them as the contextless dimensions
 * they actually are. */
const CONTEXTLESS_DIMENSION_TYPES: ReadonlySet<string> = new Set([
    'ORGANISATION_UNIT_GROUP_SET',
])

/**
 * Forward: API → app-local dimension IDs on a DimensionArray.
 *
 * The eventVisualizations API uses bare `ou` for both enrollment-scope and
 * TEI-registration-scope org units; these are distinguished only by the
 * presence/absence of a `program` qualifier on the dim record. Stage event OU
 * (with `programStage`) is a different concept and stays as `ou`.
 */
export const toAppLocalDimensions = (dims: DimensionArray): DimensionArray =>
    dims.map((dim) => {
        if (
            dim.dimensionType &&
            CONTEXTLESS_DIMENSION_TYPES.has(dim.dimensionType)
        ) {
            const stripped = { ...dim }
            delete stripped.program
            delete stripped.programStage
            return stripped
        }
        if (dim.dimension === 'ou' && !dim.programStage) {
            return { ...dim, dimension: 'enrollmentOu' }
        }
        return dim
    })

/**
 * Inverse: app-local dim → eventVisualizations POST `dimension` ID.
 *
 * `enrollmentOu` is the app-local ID for both program-scope enrollment OU
 * and TEI-registration-scope OU. The POST endpoint accepts it verbatim only
 * when it carries a program qualifier AND the visualization is in EVENT/TEI
 * `LINE_LIST` mode; otherwise it must be sent as bare `ou`. See the "Org
 * unit scopes" table in CLAUDE.md for the authoritative mapping.
 */
export const toEventVisualizationDimensionId = ({
    dimensionId,
    programId,
    outputType,
    visualizationType,
}: {
    dimensionId: string
    programId?: string
    outputType: OutputType
    visualizationType: VisualizationType
}): string => {
    if (dimensionId !== 'enrollmentOu') {
        return dimensionId
    }
    const shouldRewriteToOu =
        !programId ||
        outputType === 'ENROLLMENT' ||
        visualizationType === 'PIVOT_TABLE'
    return shouldRewriteToOu ? 'ou' : 'enrollmentOu'
}

/* Dimension types that use plain IDs (no compound prefix) even when
 * the dimension record carries program/programStage context. */
const PLAIN_ID_DIMENSION_TYPES: ReadonlySet<string> = new Set([
    'PROGRAM_INDICATOR',
    'PROGRAM_ATTRIBUTE',
])

/* Dimension IDs that are always enrollment-scoped (prefixed with programId,
 * never stageId). Legacy visualizations propagate programStage onto all
 * dimensions, but these IDs are inherently tied to the program, not a stage. */
const ENROLLMENT_SCOPED_DIMENSION_IDS: ReadonlySet<string> = new Set([
    'enrollmentOu',
    'enrollmentDate',
    'incidentDate',
    'programStatus',
])

/* Dimension IDs that belong at TEI registration scope — prefixed with
 * trackedEntityTypeId when there is no program or stage context.
 * Must match what getTrackedEntityTypeFixedDimensions produces. */
const TEI_REGISTRATION_DIMENSION_IDS: ReadonlySet<string> = new Set([
    'enrollmentOu',
    'created',
])

/**
 * Constructs the canonical compound dimension ID from a DimensionRecord.
 *
 * We do NOT use `formatDimension` / `dimensionGetId` from `@dhis2/analytics`
 * because those helpers assume the old visualization shape where `programId`
 * was only included for TRACKED_ENTITY_INSTANCE. In the canonical app-local
 * format, enrollment-scoped dimensions (program but no programStage) always
 * carry a programId prefix, regardless of outputType.
 *
 * Program indicators and tracked entity attributes always use plain IDs —
 * they carry program/stage context on the dimension record but their
 * canonical ID is not prefixed.
 */
export const getCompoundDimensionId = (
    dim: DimensionRecord,
    outputType?: OutputType,
    trackedEntityTypeId?: string
): string => {
    if (dim.dimensionType && PLAIN_ID_DIMENSION_TYPES.has(dim.dimensionType)) {
        return dim.dimension
    }
    if (ENROLLMENT_SCOPED_DIMENSION_IDS.has(dim.dimension) && dim.program?.id) {
        return `${dim.program.id}.${dim.dimension}`
    }
    if (dim.programStage?.id) {
        if (outputType === 'TRACKED_ENTITY_INSTANCE' && dim.program?.id) {
            return `${dim.program.id}.${dim.programStage.id}.${dim.dimension}`
        }
        return `${dim.programStage.id}.${dim.dimension}`
    }
    if (dim.program?.id) {
        return `${dim.program.id}.${dim.dimension}`
    }
    // TEI registration-scoped: no program or stage, prefix with trackedEntityTypeId
    if (
        trackedEntityTypeId &&
        TEI_REGISTRATION_DIMENSION_IDS.has(dim.dimension)
    ) {
        return `${trackedEntityTypeId}.${dim.dimension}`
    }
    return dim.dimension
}

/* ---------------------------------------------------------------------------
 * Fixed dimension builders — shared between sidebar and metadata provider.
 * These are the canonical source of truth for fixed dimension names.
 * --------------------------------------------------------------------------- */

export const getStageFixedDimensions = (
    program: Program,
    programStage: ProgramStage
): DimensionMetadataItem[] => [
    {
        id: `${programStage.id}.ou`,
        dimensionId: 'ou',
        dimensionType: 'ORGANISATION_UNIT',
        name: program.displayOrgUnitLabel ?? i18n.t('Event org. unit'),
        programId: program.id,
        programStageId: programStage.id,
        valueType: 'ORGANISATION_UNIT',
    },
    {
        id: `${programStage.id}.eventDate`,
        dimensionId: 'eventDate',
        dimensionType: 'PERIOD',
        name: programStage.displayExecutionDateLabel ?? i18n.t('Event date'),
        programId: program.id,
        programStageId: programStage.id,
        valueType: 'DATE',
    },
    {
        id: `${programStage.id}.scheduledDate`,
        dimensionId: 'scheduledDate',
        dimensionType: 'PERIOD',
        name: programStage.displayDueDateLabel ?? i18n.t('Scheduled date'),
        programId: program.id,
        programStageId: programStage.id,
        valueType: 'DATE',
    },
    {
        id: `${programStage.id}.eventStatus`,
        dimensionId: 'eventStatus',
        dimensionType: 'STATUS',
        name: i18n.t('Event status'),
        programId: program.id,
        programStageId: programStage.id,
        valueType: 'TEXT',
    },
]

export const getEnrollmentFixedDimensions = (
    program: Program
): DimensionMetadataItem[] => [
    {
        id: `${program.id}.enrollmentOu`,
        dimensionId: 'enrollmentOu',
        dimensionType: 'ORGANISATION_UNIT',
        name: program.displayOrgUnitLabel ?? i18n.t('Enrollment org. unit'),
        programId: program.id,
        valueType: 'ORGANISATION_UNIT',
    },
    {
        id: `${program.id}.enrollmentDate`,
        dimensionId: 'enrollmentDate',
        dimensionType: 'PERIOD',
        name:
            program.displayEnrollmentDateLabel ?? i18n.t('Date of enrollment'),
        programId: program.id,
        valueType: 'DATE',
    },
    {
        id: `${program.id}.incidentDate`,
        dimensionId: 'incidentDate',
        dimensionType: 'PERIOD',
        name: program.displayIncidentDateLabel ?? i18n.t('Incident date'),
        programId: program.id,
        valueType: 'DATE',
    },
    {
        id: `${program.id}.programStatus`,
        dimensionId: 'programStatus',
        dimensionType: 'STATUS',
        name: i18n.t('Enrollment status'),
        programId: program.id,
        valueType: 'TEXT',
    },
]

export const getTrackedEntityTypeFixedDimensions = (trackedEntityType: {
    id: string
}): DimensionMetadataItem[] => [
    {
        id: `${trackedEntityType.id}.enrollmentOu`,
        dimensionId: 'enrollmentOu',
        dimensionType: 'ORGANISATION_UNIT',
        name: i18n.t('Registration org. unit'),
        trackedEntityTypeId: trackedEntityType.id,
        valueType: 'ORGANISATION_UNIT',
    },
    {
        id: `${trackedEntityType.id}.created`,
        dimensionId: 'created',
        dimensionType: 'PERIOD',
        name: i18n.t('Registration date'),
        trackedEntityTypeId: trackedEntityType.id,
        valueType: 'DATE',
    },
]
