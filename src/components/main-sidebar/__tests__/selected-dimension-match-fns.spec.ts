import { describe, it, expect } from 'vitest'
import {
    createEnrollmentMatchFn,
    createEventWithRegistrationMatchFn as createEventWithRegMatchFn,
    createProgramIndicatorsMatchFn,
    createProgramTrackedEntityTypeMatchFn as createTrackedEntityTypeWithRegMatchFn,
    createProgramStageMatchFn as createProgramStageSubsectionMatchFn,
    createEventWithoutRegistrationMatchFn as createEventWithoutRegMatchFn,
    createTrackedEntityTypeMatchFn as createTetCardMatchFn,
    metadataMatchFn,
    otherMatchFn,
} from '@components/main-sidebar/dimension-cards-provider/matcher-functions'
import { getTetFixedDimensions as getTetCardFixedDimensions } from '@components/main-sidebar/fixed-dimensions'
import type { DimensionMetadataItem, DimensionType } from '@types'

// Shared IDs used across tests
const PROGRAM_ID = 'programAAA'
const STAGE_ID_1 = 'stageAAAAAAA'
const STAGE_ID_2 = 'stageBBBBBBB'
const TET_ID = 'tetAAAAAAA'

const dim = (
    overrides: Partial<DimensionMetadataItem>
): DimensionMetadataItem => ({
    id: 'dimId',
    dimensionId: 'dimId',
    name: 'Test dimension',
    dimensionType: 'DATA_ELEMENT' as DimensionType,
    ...overrides,
})

// ---------------------------------------------------------------------------
// CardMetadata
// ---------------------------------------------------------------------------

describe('CardMetadata — isSelectedMatchFn', () => {
    it('matches each of the 5 fixed metadata dimension IDs', () => {
        for (const id of [
            'lastUpdated',
            'lastUpdatedBy',
            'created',
            'createdBy',
            'completed',
        ]) {
            expect(metadataMatchFn(dim({ dimensionId: id }))).toBe(true)
        }
    })

    it('does not match an unrelated dimension ID', () => {
        expect(metadataMatchFn(dim({ dimensionId: 'eventDate' }))).toBe(false)
    })

    it('does not match based on dimensionType alone', () => {
        // 'created' is PERIOD — an unrelated PERIOD dim should not match
        expect(
            metadataMatchFn(
                dim({
                    dimensionId: 'someOtherPeriodDim',
                    dimensionType: 'PERIOD',
                })
            )
        ).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// CardOther
// ---------------------------------------------------------------------------

describe('CardOther — isSelectedMatchFn', () => {
    it('matches ORGANISATION_UNIT_GROUP_SET', () => {
        expect(
            otherMatchFn(dim({ dimensionType: 'ORGANISATION_UNIT_GROUP_SET' }))
        ).toBe(true)
    })

    it('does not match other dimension types', () => {
        expect(otherMatchFn(dim({ dimensionType: 'DATA_ELEMENT' }))).toBe(false)
        expect(otherMatchFn(dim({ dimensionType: 'ORGANISATION_UNIT' }))).toBe(
            false
        )
        expect(otherMatchFn(dim({ dimensionType: 'PROGRAM_INDICATOR' }))).toBe(
            false
        )
    })
})

// ---------------------------------------------------------------------------
// CardTrackedEntityType (inside a WITH_REGISTRATION program)
// ---------------------------------------------------------------------------

describe('CardTrackedEntityType (with-reg) — createIsSelectedMatchFn', () => {
    const matchFn = createTrackedEntityTypeWithRegMatchFn(TET_ID)

    it('matches the registration org unit fixed dimension by compound ID', () => {
        expect(matchFn(dim({ id: `${TET_ID}.ou` }))).toBe(true)
    })

    it('does not match the fixed dim for a different TET', () => {
        expect(matchFn(dim({ id: 'otherTet.ou' }))).toBe(false)
    })

    it('matches any PROGRAM_ATTRIBUTE regardless of ID', () => {
        expect(
            matchFn(
                dim({ id: 'someTeaId', dimensionType: 'PROGRAM_ATTRIBUTE' })
            )
        ).toBe(true)
    })

    it('does not match non-attribute, non-ou dimensions', () => {
        expect(matchFn(dim({ dimensionType: 'DATA_ELEMENT' }))).toBe(false)
        expect(matchFn(dim({ dimensionType: 'PERIOD' }))).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// CardEnrollment
// ---------------------------------------------------------------------------

describe('CardEnrollment — createIsSelectedMatchFn', () => {
    const dimensionTypeLookup = new Set<DimensionType>([
        'ORGANISATION_UNIT',
        'PERIOD',
        'STATUS',
    ])
    const matchFn = createEnrollmentMatchFn(PROGRAM_ID, dimensionTypeLookup)

    it('matches enrollment-level ORGANISATION_UNIT with correct programId and no stage', () => {
        expect(
            matchFn(
                dim({
                    dimensionType: 'ORGANISATION_UNIT',
                    programId: PROGRAM_ID,
                })
            )
        ).toBe(true)
    })

    it('matches PERIOD and STATUS with correct programId and no stage', () => {
        expect(
            matchFn(dim({ dimensionType: 'PERIOD', programId: PROGRAM_ID }))
        ).toBe(true)
        expect(
            matchFn(dim({ dimensionType: 'STATUS', programId: PROGRAM_ID }))
        ).toBe(true)
    })

    it('does not match when programId differs', () => {
        expect(
            matchFn(dim({ dimensionType: 'PERIOD', programId: 'otherProgram' }))
        ).toBe(false)
    })

    it('does not match when programStageId is set (stage-level dim)', () => {
        expect(
            matchFn(
                dim({
                    dimensionType: 'PERIOD',
                    programId: PROGRAM_ID,
                    programStageId: STAGE_ID_1,
                })
            )
        ).toBe(false)
    })

    it('does not match DATA_ELEMENT (not an enrollment type)', () => {
        expect(
            matchFn(
                dim({ dimensionType: 'DATA_ELEMENT', programId: PROGRAM_ID })
            )
        ).toBe(false)
    })

    it('does not match PROGRAM_INDICATOR', () => {
        expect(
            matchFn(
                dim({
                    dimensionType: 'PROGRAM_INDICATOR',
                    programId: PROGRAM_ID,
                })
            )
        ).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// CardProgramIndicators
// ---------------------------------------------------------------------------

describe('CardProgramIndicators — createIsSelectedMatchFn', () => {
    const matchFn = createProgramIndicatorsMatchFn(PROGRAM_ID)

    it('matches PROGRAM_INDICATOR with the correct programId', () => {
        expect(
            matchFn(
                dim({
                    dimensionType: 'PROGRAM_INDICATOR',
                    programId: PROGRAM_ID,
                })
            )
        ).toBe(true)
    })

    it('does not match when programId differs', () => {
        expect(
            matchFn(
                dim({
                    dimensionType: 'PROGRAM_INDICATOR',
                    programId: 'otherProgram',
                })
            )
        ).toBe(false)
    })

    it('does not match other dimension types', () => {
        expect(
            matchFn(
                dim({ dimensionType: 'DATA_ELEMENT', programId: PROGRAM_ID })
            )
        ).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// CardEvent (with-registration) — card-level aggregation across all stages
// ---------------------------------------------------------------------------

describe('CardEvent (with-reg) — createIsSelectedMatchFn', () => {
    const stageIdLookup = new Set([STAGE_ID_1, STAGE_ID_2])
    const matchFn = createEventWithRegMatchFn(stageIdLookup)

    it('matches DATA_ELEMENT with a stage that belongs to the program', () => {
        expect(
            matchFn(
                dim({
                    dimensionType: 'DATA_ELEMENT',
                    programStageId: STAGE_ID_1,
                })
            )
        ).toBe(true)
        expect(
            matchFn(
                dim({
                    dimensionType: 'DATA_ELEMENT',
                    programStageId: STAGE_ID_2,
                })
            )
        ).toBe(true)
    })

    it('matches event fixed types (ORGANISATION_UNIT, PERIOD, STATUS) with a known stage', () => {
        expect(
            matchFn(
                dim({
                    dimensionType: 'ORGANISATION_UNIT',
                    programStageId: STAGE_ID_1,
                })
            )
        ).toBe(true)
        expect(
            matchFn(
                dim({ dimensionType: 'PERIOD', programStageId: STAGE_ID_1 })
            )
        ).toBe(true)
        expect(
            matchFn(
                dim({ dimensionType: 'STATUS', programStageId: STAGE_ID_1 })
            )
        ).toBe(true)
    })

    it('does not match when stage does not belong to the program', () => {
        expect(
            matchFn(
                dim({
                    dimensionType: 'DATA_ELEMENT',
                    programStageId: 'unknownStage',
                })
            )
        ).toBe(false)
    })

    it('does not match when programStageId is absent', () => {
        expect(matchFn(dim({ dimensionType: 'DATA_ELEMENT' }))).toBe(false)
    })

    it('does not match PROGRAM_INDICATOR', () => {
        expect(
            matchFn(
                dim({
                    dimensionType: 'PROGRAM_INDICATOR',
                    programStageId: STAGE_ID_1,
                })
            )
        ).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// ProgramStageSubsection — per-stage matching
// ---------------------------------------------------------------------------

describe('ProgramStageSubsection — createIsSelectedMatchFn', () => {
    const matchFn = createProgramStageSubsectionMatchFn(STAGE_ID_1)

    it('matches DATA_ELEMENT belonging to this stage', () => {
        expect(
            matchFn(
                dim({
                    dimensionType: 'DATA_ELEMENT',
                    programStageId: STAGE_ID_1,
                })
            )
        ).toBe(true)
    })

    it('matches event fixed types for this stage', () => {
        expect(
            matchFn(
                dim({
                    dimensionType: 'ORGANISATION_UNIT',
                    programStageId: STAGE_ID_1,
                })
            )
        ).toBe(true)
        expect(
            matchFn(
                dim({ dimensionType: 'PERIOD', programStageId: STAGE_ID_1 })
            )
        ).toBe(true)
        expect(
            matchFn(
                dim({ dimensionType: 'STATUS', programStageId: STAGE_ID_1 })
            )
        ).toBe(true)
    })

    it('does not match a dimension belonging to a different stage', () => {
        expect(
            matchFn(
                dim({
                    dimensionType: 'DATA_ELEMENT',
                    programStageId: STAGE_ID_2,
                })
            )
        ).toBe(false)
    })

    it('does not match when programStageId is absent', () => {
        expect(matchFn(dim({ dimensionType: 'DATA_ELEMENT' }))).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// CardEvent (without-registration)
// ---------------------------------------------------------------------------

describe('CardEvent (without-reg) — createIsSelectedMatchFn', () => {
    const dimensionTypeLookup = new Set<DimensionType>([
        'ORGANISATION_UNIT',
        'PERIOD',
        'STATUS',
        'DATA_ELEMENT',
    ])
    const matchFn = createEventWithoutRegMatchFn(
        STAGE_ID_1,
        dimensionTypeLookup
    )

    it('matches DATA_ELEMENT for the program stage', () => {
        expect(
            matchFn(
                dim({
                    dimensionType: 'DATA_ELEMENT',
                    programStageId: STAGE_ID_1,
                })
            )
        ).toBe(true)
    })

    it('matches event fixed types for the program stage', () => {
        expect(
            matchFn(
                dim({
                    dimensionType: 'ORGANISATION_UNIT',
                    programStageId: STAGE_ID_1,
                })
            )
        ).toBe(true)
        expect(
            matchFn(
                dim({ dimensionType: 'PERIOD', programStageId: STAGE_ID_1 })
            )
        ).toBe(true)
        expect(
            matchFn(
                dim({ dimensionType: 'STATUS', programStageId: STAGE_ID_1 })
            )
        ).toBe(true)
    })

    it('does not match a dimension for a different stage', () => {
        expect(
            matchFn(
                dim({
                    dimensionType: 'DATA_ELEMENT',
                    programStageId: STAGE_ID_2,
                })
            )
        ).toBe(false)
    })

    it('does not match when programStageId is absent', () => {
        expect(matchFn(dim({ dimensionType: 'DATA_ELEMENT' }))).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// CardType (standalone TET card)
// ---------------------------------------------------------------------------

describe('CardType (TET) — createIsSelectedMatchFn', () => {
    const tetMetadataItem = {
        id: TET_ID,
        name: 'Person',
        dimensionId: TET_ID,
        dimensionType: 'ORGANISATION_UNIT',
    } as DimensionMetadataItem
    const fixedDimensionIdLookup = new Set(
        getTetCardFixedDimensions(tetMetadataItem).map((d) => d.id)
    )
    const matchFn = createTetCardMatchFn(TET_ID, fixedDimensionIdLookup)

    it('matches a fixed dimension (ou) with correct trackedEntityTypeId and compound ID', () => {
        expect(
            matchFn(
                dim({
                    id: `${TET_ID}.ou`,
                    dimensionType: 'ORGANISATION_UNIT',
                    trackedEntityTypeId: TET_ID,
                })
            )
        ).toBe(true)
    })

    it('matches a fixed dimension (created) with correct trackedEntityTypeId and compound ID', () => {
        expect(
            matchFn(
                dim({
                    id: `${TET_ID}.created`,
                    dimensionType: 'PERIOD',
                    trackedEntityTypeId: TET_ID,
                })
            )
        ).toBe(true)
    })

    it('does not match a fixed dim when trackedEntityTypeId is for a different TET', () => {
        expect(
            matchFn(
                dim({
                    id: `${TET_ID}.ou`,
                    dimensionType: 'ORGANISATION_UNIT',
                    trackedEntityTypeId: 'otherTet',
                })
            )
        ).toBe(false)
    })

    it('does not match a fixed dim when compound ID does not belong to this TET', () => {
        expect(
            matchFn(
                dim({
                    id: 'otherTet.ou',
                    dimensionType: 'ORGANISATION_UNIT',
                    trackedEntityTypeId: TET_ID,
                })
            )
        ).toBe(false)
    })

    it('matches a TEA (PROGRAM_ATTRIBUTE) with no program or stage context — plain API ID path', () => {
        expect(
            matchFn(
                dim({
                    id: 'teaPlainId',
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                })
            )
        ).toBe(true)
    })

    it('does not match a PROGRAM_ATTRIBUTE that has a programId (belongs to a program card)', () => {
        expect(
            matchFn(
                dim({
                    id: 'teaPlainId',
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    programId: PROGRAM_ID,
                })
            )
        ).toBe(false)
    })

    it('does not match a PROGRAM_ATTRIBUTE that has a programStageId', () => {
        expect(
            matchFn(
                dim({
                    id: 'teaPlainId',
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    programStageId: STAGE_ID_1,
                })
            )
        ).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// Cross-card discrimination
// Each dimension below should match at most one card's match function.
// Where two cards intentionally share a match (mutually exclusive in the UI),
// the comment explains why.
// ---------------------------------------------------------------------------

describe('cross-card discrimination', () => {
    const enrollmentDimensionTypeLookup = new Set<DimensionType>([
        'ORGANISATION_UNIT',
        'PERIOD',
        'STATUS',
    ])
    const eventWithoutRegDimensionTypeLookup = new Set<DimensionType>([
        'ORGANISATION_UNIT',
        'PERIOD',
        'STATUS',
        'DATA_ELEMENT',
    ])
    const stageIdLookup = new Set([STAGE_ID_1, STAGE_ID_2])
    const tetFixedDimensionIdLookup = new Set(
        getTetCardFixedDimensions({
            id: TET_ID,
            name: 'Person',
            dimensionId: TET_ID,
            dimensionType: 'ORGANISATION_UNIT',
        } as DimensionMetadataItem).map((d) => d.id)
    )

    const allMatchFns = [
        { name: 'metadata', fn: metadataMatchFn },
        { name: 'other', fn: otherMatchFn },
        {
            name: 'tet-with-reg-program',
            fn: createTrackedEntityTypeWithRegMatchFn(TET_ID),
        },
        {
            name: 'enrollment',
            fn: createEnrollmentMatchFn(
                PROGRAM_ID,
                enrollmentDimensionTypeLookup
            ),
        },
        {
            name: 'program-indicators',
            fn: createProgramIndicatorsMatchFn(PROGRAM_ID),
        },
        {
            name: 'event-with-reg',
            fn: createEventWithRegMatchFn(stageIdLookup),
        },
        {
            name: 'stage-subsection-1',
            fn: createProgramStageSubsectionMatchFn(STAGE_ID_1),
        },
        {
            name: 'event-without-reg',
            fn: createEventWithoutRegMatchFn(
                STAGE_ID_1,
                eventWithoutRegDimensionTypeLookup
            ),
        },
        {
            name: 'tet-card',
            fn: createTetCardMatchFn(TET_ID, tetFixedDimensionIdLookup),
        },
    ]

    const assertExactMatches = (
        dimension: DimensionMetadataItem,
        expectedMatches: string[]
    ) => {
        const matches = allMatchFns
            .filter(({ fn }) => fn(dimension))
            .map(({ name }) => name)
        expect(matches.sort()).toEqual(expectedMatches.sort())
    }

    const assertAtMostOneMatch = (dimension: DimensionMetadataItem) => {
        const matches = allMatchFns
            .filter(({ fn }) => fn(dimension))
            .map(({ name }) => name)
        expect(matches.length).toBeLessThanOrEqual(1)
    }

    it('metadata fixed dimension (lastUpdated) matches only the metadata card', () => {
        assertAtMostOneMatch(
            dim({ dimensionId: 'lastUpdated', dimensionType: 'PERIOD' })
        )
    })

    it('ORGANISATION_UNIT_GROUP_SET matches only the other card', () => {
        assertAtMostOneMatch(
            dim({ dimensionType: 'ORGANISATION_UNIT_GROUP_SET' })
        )
    })

    it('PROGRAM_INDICATOR matches only program-indicators', () => {
        assertAtMostOneMatch(
            dim({ dimensionType: 'PROGRAM_INDICATOR', programId: PROGRAM_ID })
        )
    })

    it('enrollment-level ORGANISATION_UNIT (programId set, no stage) matches only enrollment', () => {
        assertAtMostOneMatch(
            dim({ dimensionType: 'ORGANISATION_UNIT', programId: PROGRAM_ID })
        )
    })

    it('stage-level DATA_ELEMENT matches event-with-reg card and the specific stage subsection', () => {
        // Both the card-level aggregation and the subsection match — this is intentional:
        // the card total is the sum of all its subsections, so the same dim is counted at both levels.
        // In practice only the subsection count is displayed per-stage; the card total covers all stages.
        assertExactMatches(
            dim({ dimensionType: 'DATA_ELEMENT', programStageId: STAGE_ID_1 }),
            ['event-with-reg', 'stage-subsection-1', 'event-without-reg']
        )
    })

    it('TET fixed dim (with trackedEntityTypeId) matches only the two TET cards — mutually exclusive in UI', () => {
        // Both TET cards match this: the with-reg card matches by compound ID, the standalone card
        // matches by trackedEntityTypeId + compound ID. They are never rendered simultaneously.
        assertExactMatches(
            dim({
                id: `${TET_ID}.ou`,
                dimensionType: 'ORGANISATION_UNIT',
                trackedEntityTypeId: TET_ID,
            }),
            ['tet-with-reg-program', 'tet-card']
        )
    })

    it('plain PROGRAM_ATTRIBUTE (no programId/stageId) matches both TET cards — mutually exclusive in UI', () => {
        // The with-reg TET card and standalone TET card are never rendered simultaneously:
        // the with-reg card appears inside a tracker program, the standalone card inside a TET data source.
        assertExactMatches(
            dim({ id: 'teaPlainId', dimensionType: 'PROGRAM_ATTRIBUTE' }),
            ['tet-with-reg-program', 'tet-card']
        )
    })

    it('PROGRAM_ATTRIBUTE with programId is not claimed by any card', () => {
        // A PROGRAM_ATTRIBUTE with a programId is a program-scoped attribute.
        // No card currently claims it — the with-reg TET card was tightened to
        // require !programId && !programStageId, matching the standalone TET card.
        assertAtMostOneMatch(
            dim({
                id: 'teaPlainId',
                dimensionType: 'PROGRAM_ATTRIBUTE',
                programId: PROGRAM_ID,
            })
        )
    })
})
