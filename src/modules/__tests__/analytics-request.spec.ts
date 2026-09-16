import {
    analyticsHeaderToCanonicalDimensionId,
    getAnalyticsRequestDimensionName,
    getAnalyticsRequestHeaderName,
} from '@modules/analytics-request'
import type { CurrentVisualization } from '@types'
import { describe, it, expect } from 'vitest'

const PID = 'pid'
const SID = 'sid'
const TET = 'tet'
const UID = 'a3kGcGDCuk6'
const LSID = 'OrkEzxZEH4X'

const buildVis = (
    overrides: Partial<CurrentVisualization> = {}
): CurrentVisualization =>
    ({
        type: 'LINE_LIST',
        outputType: 'EVENT',
        programDimensions: [{ id: PID, programStages: [] }],
        ...overrides,
    }) as unknown as CurrentVisualization

describe('analyticsHeaderToCanonicalDimensionId', () => {
    it('preserves a stage prefix (any outputType)', () => {
        expect(
            analyticsHeaderToCanonicalDimensionId(
                `${SID}.eventdate`,
                buildVis()
            )
        ).toBe(`${SID}.eventDate`)
    })

    it('strips the repetition index from a repeated stage prefix', () => {
        expect(
            analyticsHeaderToCanonicalDimensionId(
                `${SID}[-1].${UID}`,
                buildVis()
            )
        ).toBe(`${SID}.${UID}`)
        expect(
            analyticsHeaderToCanonicalDimensionId(
                `${SID}[0].${UID}`,
                buildVis()
            )
        ).toBe(`${SID}.${UID}`)
    })

    it('rewrites bare `ou` to `tetId.enrollmentOu` in TE', () => {
        const vis = buildVis({
            outputType: 'TRACKED_ENTITY_INSTANCE',
            trackedEntityType: { id: TET, name: 'Person' },
        })
        expect(analyticsHeaderToCanonicalDimensionId('ouname', vis)).toBe(
            `${TET}.enrollmentOu`
        )
    })

    it('returns plain for other bare wire dims in TE', () => {
        const vis = buildVis({
            outputType: 'TRACKED_ENTITY_INSTANCE',
            trackedEntityType: { id: TET, name: 'Person' },
        })
        expect(analyticsHeaderToCanonicalDimensionId('lastupdated', vis)).toBe(
            'lastUpdated'
        )
    })

    it('injects programId for bare `ou` in ENR', () => {
        expect(
            analyticsHeaderToCanonicalDimensionId(
                'ouname',
                buildVis({ outputType: 'ENROLLMENT' })
            )
        ).toBe(`${PID}.enrollmentOu`)
    })

    it('injects programId for bare enrollment-scoped dims in EVENT', () => {
        expect(
            analyticsHeaderToCanonicalDimensionId('enrollmentdate', buildVis())
        ).toBe(`${PID}.enrollmentDate`)
    })

    it('returns plain for non-enrollment-scoped bare dims', () => {
        expect(
            analyticsHeaderToCanonicalDimensionId('lastupdated', buildVis())
        ).toBe('lastUpdated')
        expect(analyticsHeaderToCanonicalDimensionId(UID, buildVis())).toBe(UID)
    })

    it('reverses `ounamehierarchy` to `ou`', () => {
        expect(
            analyticsHeaderToCanonicalDimensionId(
                `${SID}.ounamehierarchy`,
                buildVis()
            )
        ).toBe(`${SID}.ou`)
    })
})

describe('getAnalyticsRequestDimensionName', () => {
    it('prefixes stage and SCREAMING_SNAKE-cases known dims', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: 'eventDate',
                programStageId: SID,
                outputType: 'EVENT',
            })
        ).toBe(`${SID}.EVENT_DATE`)
    })

    it('prefixes stage and leaves UIDs alone', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: UID,
                programStageId: SID,
                outputType: 'EVENT',
            })
        ).toBe(`${SID}.${UID}`)
    })

    it('rewrites TE registration `enrollmentOu` to bare `ou`', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: 'enrollmentOu',
                trackedEntityTypeId: TET,
                outputType: 'TRACKED_ENTITY_INSTANCE',
            })
        ).toBe('ou')
    })

    it('emits bare SCREAMING_SNAKE for other TE registration dims', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: 'created',
                trackedEntityTypeId: TET,
                outputType: 'TRACKED_ENTITY_INSTANCE',
            })
        ).toBe('CREATED')
    })

    it('prefixes programId for enrollment-scoped dims in TE', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: 'enrollmentOu',
                programId: PID,
                outputType: 'TRACKED_ENTITY_INSTANCE',
            })
        ).toBe(`${PID}.ENROLLMENT_OU`)
    })

    it('rewrites ENR `enrollmentOu` to bare `ou`', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: 'enrollmentOu',
                programId: PID,
                outputType: 'ENROLLMENT',
            })
        ).toBe('ou')
    })

    it('emits bare SCREAMING_SNAKE for enrollment-scoped dims in EVENT', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: 'enrollmentDate',
                programId: PID,
                outputType: 'EVENT',
            })
        ).toBe('ENROLLMENT_DATE')
    })

    it('returns plain UID for unprefixed UID dims', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: UID,
                outputType: 'EVENT',
            })
        ).toBe(UID)
    })

    it('appends the legend set suffix to a stage-prefixed dim', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: UID,
                programStageId: SID,
                legendSetId: LSID,
                outputType: 'EVENT',
            })
        ).toBe(`${SID}.${UID}-${LSID}`)
    })

    it('appends the legend set suffix to an unprefixed dim', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: UID,
                legendSetId: LSID,
                outputType: 'EVENT',
            })
        ).toBe(`${UID}-${LSID}`)
    })

    it('appends the legend set suffix after a programId prefix in TE', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: UID,
                programId: PID,
                legendSetId: LSID,
                outputType: 'TRACKED_ENTITY_INSTANCE',
            })
        ).toBe(`${PID}.${UID}-${LSID}`)
    })

    it('renders a repetition index on the stage segment', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: UID,
                programStageId: SID,
                repetitionIndex: 1,
                outputType: 'EVENT',
            })
        ).toBe(`${SID}[1].${UID}`)
    })

    /* parseUiRepetitions emits 0 and negative indexes for the "most recent"
     * side, so these must survive a falsy check. */
    it.each([0, -1])('renders repetition index %i', (repetitionIndex) => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: UID,
                programStageId: SID,
                repetitionIndex,
                outputType: 'EVENT',
            })
        ).toBe(`${SID}[${repetitionIndex}].${UID}`)
    })

    it('ignores a repetition index when there is no stage', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: UID,
                repetitionIndex: 1,
                outputType: 'EVENT',
            })
        ).toBe(UID)
    })

    it('combines a repetition index and a legend set suffix', () => {
        expect(
            getAnalyticsRequestDimensionName({
                dimensionId: UID,
                programStageId: SID,
                repetitionIndex: 1,
                legendSetId: LSID,
                outputType: 'EVENT',
            })
        ).toBe(`${SID}[1].${UID}-${LSID}`)
    })
})

describe('getAnalyticsRequestHeaderName', () => {
    it('prefixes stage with lowercase wire dim', () => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: 'eventDate',
                programStageId: SID,
                visualization: buildVis(),
            })
        ).toBe(`${SID}.eventdate`)
    })

    it('rewrites TE registration `enrollmentOu` to bare `ouname`', () => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: 'enrollmentOu',
                trackedEntityTypeId: TET,
                visualization: buildVis({
                    outputType: 'TRACKED_ENTITY_INSTANCE',
                    trackedEntityType: { id: TET, name: 'Person' },
                }),
            })
        ).toBe('ouname')
    })

    it('prefixes programId for enrollment-scoped dims in TE', () => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: 'enrollmentDate',
                programId: PID,
                visualization: buildVis({
                    outputType: 'TRACKED_ENTITY_INSTANCE',
                }),
            })
        ).toBe(`${PID}.enrollmentdate`)
    })

    it('uses ENR override mapping `enrollmentOu` to `ouname`', () => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: 'enrollmentOu',
                programId: PID,
                visualization: buildVis({ outputType: 'ENROLLMENT' }),
            })
        ).toBe('ouname')
    })

    it('emits bare lowercase for enrollment-scoped dims in EVENT', () => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: 'enrollmentOu',
                programId: PID,
                visualization: buildVis(),
            })
        ).toBe('enrollmentouname')
    })

    it('returns plain UID for plain UID dims', () => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: UID,
                visualization: buildVis(),
            })
        ).toBe(UID)
    })

    it('emits `ounamehierarchy` for stage `ou` when showHierarchy is on', () => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: 'ou',
                programStageId: SID,
                visualization: buildVis({ showHierarchy: true }),
            })
        ).toBe(`${SID}.ounamehierarchy`)
    })
    it('renders a repetition index on the stage segment', () => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: 'eventDate',
                programStageId: SID,
                repetitionIndex: 1,
                visualization: buildVis(),
            })
        ).toBe(`${SID}[1].eventdate`)
    })

    it.each([0, -1])('renders repetition index %i', (repetitionIndex) => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: 'eventDate',
                programStageId: SID,
                repetitionIndex,
                visualization: buildVis(),
            })
        ).toBe(`${SID}[${repetitionIndex}].eventdate`)
    })

    /* The response header the engine echoes back carries no legend set suffix,
     * so the header name must not accept one. */
    it('does not accept a legend set', () => {
        expect(
            getAnalyticsRequestHeaderName({
                dimensionId: UID,
                programStageId: SID,
                // @ts-expect-error legendSetId belongs to the dimension name only
                legendSetId: LSID,
                visualization: buildVis(),
            })
        ).toBe(`${SID}.${UID}`)
    })
})
