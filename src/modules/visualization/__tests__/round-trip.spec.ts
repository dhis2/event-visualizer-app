import { DEFAULT_OPTIONS } from '@constants/options'
import { MetadataStore } from '@modules/metadata/store'
import legacyEnrollmentPivotTable from '@modules/visualization/__fixtures__/round-trip/legacy/enrollment-pivot-table.json'
import legacyEventLineList from '@modules/visualization/__fixtures__/round-trip/legacy/event-line-list.json'
import legacyEventPivotTableAttribute from '@modules/visualization/__fixtures__/round-trip/legacy/event-pivot-table-attribute.json'
import legacyEventPivotTableCustomValue from '@modules/visualization/__fixtures__/round-trip/legacy/event-pivot-table-custom-value.json'
import enrollmentLineList from '@modules/visualization/__fixtures__/round-trip/saved/enrollment-line-list.json'
import enrollmentPivotTable from '@modules/visualization/__fixtures__/round-trip/saved/enrollment-pivot-table.json'
import eventLineListEventProgram from '@modules/visualization/__fixtures__/round-trip/saved/event-line-list-event-program.json'
import eventLineListTrackerProgram from '@modules/visualization/__fixtures__/round-trip/saved/event-line-list-tracker-program.json'
import eventPivotTableLegendGrouping from '@modules/visualization/__fixtures__/round-trip/saved/event-pivot-table-legend-grouping.json'
import eventPivotTable from '@modules/visualization/__fixtures__/round-trip/saved/event-pivot-table.json'
import trackedEntityLineListOneProgram from '@modules/visualization/__fixtures__/round-trip/saved/tracked-entity-line-list-one-program.json'
import trackedEntityLineListTrackedEntityType from '@modules/visualization/__fixtures__/round-trip/saved/tracked-entity-line-list-tracked-entity-type.json'
import trackedEntityLineListTwoPrograms from '@modules/visualization/__fixtures__/round-trip/saved/tracked-entity-line-list-two-programs.json'
import {
    buildCurrentVisFromVisUiConfig,
    toCurrentVis,
} from '@modules/visualization/current-vis'
import { normalizeApiSavedVisualization } from '@modules/visualization/normalize-legacy'
import { areVisualizationsEquivalent } from '@modules/visualization/state'
import { getVisualizationUiConfig } from '@modules/visualization/ui-config'
import type { VisUiConfigState } from '@store/vis-ui-config-slice'
import type { ApiSavedVisualization, Layout } from '@types'
import { describe, expect, it } from 'vitest'
import { sidebarIds } from './round-trip-test-utils'

/* Loading a saved visualization and applying the ui config derived from it
 * must give back an equivalent visualization, and deriving the ui config
 * again must give back the same ui config. Code that derives ui config from
 * an applied visualization relies on this. */

const CHILD_PROGRAMME = 'IpHINAT79UW'
const BIRTH = 'A03MvHHogjR'
const TB_PROGRAM = 'ur1Edk5Oe2n'
const LAB_MONITORING = 'EPEcjy3FWmI'
const INPATIENT_PROGRAM = 'eBAyeGv0exc'
const INPATIENT_STAGE = 'Zj7UnCAulEk'

type RoundTripCase = {
    name: string
    fixture: unknown
    /* The layout the loaded visualization must have, written in the ids the
     * sidebar gives each dimension. */
    expectedLayout: Layout
}

const savedCases: RoundTripCase[] = [
    {
        name: 'an event line list on a tracker program',
        fixture: eventLineListTrackerProgram,
        expectedLayout: {
            columns: [
                sidebarIds.stage(CHILD_PROGRAMME, BIRTH, 'ou'),
                sidebarIds.stage(CHILD_PROGRAMME, BIRTH, 'eventDate'),
                sidebarIds.enrollment(CHILD_PROGRAMME, 'enrollmentDate'),
                sidebarIds.enrollment(CHILD_PROGRAMME, 'programStatus'),
                sidebarIds.dataElement(BIRTH, 'UXz7xuGCEhU'),
                sidebarIds.programIndicator(CHILD_PROGRAMME, 'GxdhnY5wmHq'),
                sidebarIds.organisationUnitGroupSet('S3leNRWRV3x'),
                sidebarIds.metadata('lastUpdated'),
            ],
            rows: [],
            filters: [
                sidebarIds.programAttribute(CHILD_PROGRAMME, 'w75KJ2mc4zz'),
            ],
        },
    },
    {
        name: 'an enrollment line list with repetitions',
        fixture: enrollmentLineList,
        expectedLayout: {
            columns: [
                sidebarIds.enrollment(TB_PROGRAM, 'enrollmentOu'),
                sidebarIds.enrollment(TB_PROGRAM, 'enrollmentDate'),
                sidebarIds.enrollment(TB_PROGRAM, 'incidentDate'),
                sidebarIds.programAttribute(TB_PROGRAM, 'VqEFza8wbwA'),
                sidebarIds.dataElement(LAB_MONITORING, 'Vk1tzSQxvOR'),
            ],
            rows: [],
            filters: [],
        },
    },
    {
        name: 'an event pivot table',
        fixture: eventPivotTable,
        expectedLayout: {
            columns: [
                sidebarIds.programAttribute(CHILD_PROGRAMME, 'cejWyOfXge6'),
                sidebarIds.dataElement(BIRTH, 'wQLfBvPrXqq'),
            ],
            rows: [sidebarIds.stage(CHILD_PROGRAMME, BIRTH, 'ou')],
            filters: [sidebarIds.stage(CHILD_PROGRAMME, BIRTH, 'eventDate')],
        },
    },
    {
        name: 'an enrollment pivot table',
        fixture: enrollmentPivotTable,
        expectedLayout: {
            columns: [
                sidebarIds.programAttribute(CHILD_PROGRAMME, 'cejWyOfXge6'),
            ],
            rows: [sidebarIds.enrollment(CHILD_PROGRAMME, 'enrollmentOu')],
            filters: [
                sidebarIds.enrollment(CHILD_PROGRAMME, 'programStatus'),
                sidebarIds.enrollment(CHILD_PROGRAMME, 'enrollmentDate'),
            ],
        },
    },
    {
        name: 'a tracked entity line list on one program',
        fixture: trackedEntityLineListOneProgram,
        expectedLayout: {
            columns: [
                sidebarIds.registration('enrollmentOu'),
                sidebarIds.dataElement(LAB_MONITORING, 'Vk1tzSQxvOR'),
                sidebarIds.enrollment(TB_PROGRAM, 'enrollmentDate'),
                sidebarIds.stage(TB_PROGRAM, LAB_MONITORING, 'ou'),
            ],
            rows: [],
            filters: [sidebarIds.programAttribute(TB_PROGRAM, 'VqEFza8wbwA')],
        },
    },
    {
        name: 'a tracked entity line list on two programs',
        fixture: trackedEntityLineListTwoPrograms,
        expectedLayout: {
            columns: [
                sidebarIds.registration('enrollmentOu'),
                sidebarIds.stage(TB_PROGRAM, LAB_MONITORING, 'ou'),
                sidebarIds.enrollment(TB_PROGRAM, 'enrollmentDate'),
                sidebarIds.dataElement(BIRTH, 'UXz7xuGCEhU'),
                sidebarIds.enrollment(CHILD_PROGRAMME, 'enrollmentOu'),
                sidebarIds.stage(CHILD_PROGRAMME, BIRTH, 'eventDate'),
                sidebarIds.programAttribute(CHILD_PROGRAMME, 'w75KJ2mc4zz'),
            ],
            rows: [],
            filters: [],
        },
    },
    {
        name: 'a tracked entity line list on a tracked entity type',
        fixture: trackedEntityLineListTrackedEntityType,
        expectedLayout: {
            columns: [
                sidebarIds.registration('enrollmentOu'),
                sidebarIds.trackedEntityTypeAttribute('w75KJ2mc4zz'),
                sidebarIds.trackedEntityTypeAttribute('lZGmxYbs97q'),
                sidebarIds.metadata('created'),
                sidebarIds.organisationUnitGroupSet('S3leNRWRV3x'),
            ],
            rows: [],
            filters: [sidebarIds.trackedEntityTypeAttribute('zDhUuAYrxNC')],
        },
    },
    {
        name: 'an event line list on an event program',
        fixture: eventLineListEventProgram,
        expectedLayout: {
            columns: [
                sidebarIds.stage(INPATIENT_PROGRAM, INPATIENT_STAGE, 'ou'),
                sidebarIds.stage(
                    INPATIENT_PROGRAM,
                    INPATIENT_STAGE,
                    'eventDate'
                ),
                sidebarIds.dataElement(INPATIENT_STAGE, 'K6uUAvq500H'),
                sidebarIds.programIndicator(INPATIENT_PROGRAM, 'tUdBD1JDxpn'),
                sidebarIds.stage(
                    INPATIENT_PROGRAM,
                    INPATIENT_STAGE,
                    'eventStatus'
                ),
            ],
            rows: [],
            filters: [],
        },
    },
    {
        name: 'an event pivot table grouped by a legend set',
        fixture: eventPivotTableLegendGrouping,
        expectedLayout: {
            columns: [sidebarIds.dataElement(INPATIENT_STAGE, 'GieVkTxp4HH')],
            rows: [sidebarIds.stage(INPATIENT_PROGRAM, INPATIENT_STAGE, 'ou')],
            filters: [
                sidebarIds.stage(
                    INPATIENT_PROGRAM,
                    INPATIENT_STAGE,
                    'eventDate'
                ),
            ],
        },
    },
]

const legacyCases: RoundTripCase[] = [
    {
        name: 'a legacy event pivot table with an attribute',
        fixture: legacyEventPivotTableAttribute,
        expectedLayout: {
            columns: [
                sidebarIds.stage(CHILD_PROGRAMME, BIRTH, 'eventDate'),
                sidebarIds.programAttribute(CHILD_PROGRAMME, 'cejWyOfXge6'),
            ],
            rows: [
                sidebarIds.dataElement(BIRTH, 'wQLfBvPrXqq'),
                sidebarIds.stage(CHILD_PROGRAMME, BIRTH, 'ou'),
            ],
            filters: [sidebarIds.enrollment(CHILD_PROGRAMME, 'programStatus')],
        },
    },
    {
        name: 'a legacy event line list',
        fixture: legacyEventLineList,
        expectedLayout: {
            columns: [
                sidebarIds.stage(
                    INPATIENT_PROGRAM,
                    INPATIENT_STAGE,
                    'eventDate'
                ),
                sidebarIds.stage(INPATIENT_PROGRAM, INPATIENT_STAGE, 'ou'),
                sidebarIds.dataElement(INPATIENT_STAGE, 'eMyVanycQSC'),
                sidebarIds.dataElement(INPATIENT_STAGE, 'qrur9Dvnyt5'),
                sidebarIds.dataElement(INPATIENT_STAGE, 'K6uUAvq500H'),
                sidebarIds.dataElement(INPATIENT_STAGE, 'msodh3rEMJa'),
                sidebarIds.dataElement(INPATIENT_STAGE, 'oZg33kd9taw'),
                sidebarIds.dataElement(INPATIENT_STAGE, 'fWIAEtYVEGk'),
            ],
            rows: [],
            filters: [],
        },
    },
    {
        name: 'a legacy enrollment pivot table',
        fixture: legacyEnrollmentPivotTable,
        expectedLayout: {
            columns: [
                sidebarIds.stage(CHILD_PROGRAMME, BIRTH, 'ou'),
                sidebarIds.enrollment(CHILD_PROGRAMME, 'enrollmentDate'),
            ],
            rows: [sidebarIds.dataElement(BIRTH, 'a3kGcGDCuk6')],
            filters: [],
        },
    },
    {
        name: 'a legacy event pivot table with a custom value',
        fixture: legacyEventPivotTableCustomValue,
        expectedLayout: {
            columns: [sidebarIds.stage(CHILD_PROGRAMME, BIRTH, 'eventDate')],
            rows: [sidebarIds.dataElement(BIRTH, 'wQLfBvPrXqq')],
            filters: [sidebarIds.stage(CHILD_PROGRAMME, BIRTH, 'ou')],
        },
    },
]

/* The steps the app takes to load a visualization and then press Update
 * without changing anything. */
const roundTrip = (fixture: unknown) => {
    const savedVis = normalizeApiSavedVisualization(
        fixture as ApiSavedVisualization
    )
    const metadataStore = new MetadataStore({})
    metadataStore.setVisualizationMetadata(savedVis)

    const currentVisFromApiVis = toCurrentVis(savedVis)
    const visUiConfigFromCurrentVis = getVisualizationUiConfig(
        currentVisFromApiVis,
        DEFAULT_OPTIONS
    ) as VisUiConfigState
    const currentVisFromVisUiConfig = buildCurrentVisFromVisUiConfig({
        previousCurrentVis: currentVisFromApiVis,
        visUiConfig: visUiConfigFromCurrentVis,
        metadataStore,
    })

    return {
        currentVisFromApiVis,
        visUiConfigFromCurrentVis,
        currentVisFromVisUiConfig,
        visUiConfigFromRebuiltVis: getVisualizationUiConfig(
            currentVisFromVisUiConfig,
            DEFAULT_OPTIONS
        ),
    }
}

describe.each([...savedCases, ...legacyCases])(
    'the round trip of $name',
    ({ fixture, expectedLayout }) => {
        it('rebuilds an equivalent visualization from that ui config', () => {
            const { currentVisFromApiVis, currentVisFromVisUiConfig } =
                roundTrip(fixture)

            expect(
                areVisualizationsEquivalent(
                    currentVisFromApiVis,
                    currentVisFromVisUiConfig
                )
            ).toBe(true)
        })

        /* areVisualizationsEquivalent ignores the tracked entity type, which
         * the backend reads as marking a multi-program visualization. */
        it('rebuilds the same tracked entity type', () => {
            const { currentVisFromApiVis, currentVisFromVisUiConfig } =
                roundTrip(fixture)

            expect(currentVisFromVisUiConfig.trackedEntityType).toEqual(
                currentVisFromApiVis.trackedEntityType
            )
        })

        it('derives the same ui config from the rebuilt visualization', () => {
            const { visUiConfigFromCurrentVis, visUiConfigFromRebuiltVis } =
                roundTrip(fixture)

            expect(visUiConfigFromRebuiltVis).toEqual(visUiConfigFromCurrentVis)
        })

        it('keys the layout with the sidebar ids', () => {
            expect(roundTrip(fixture).visUiConfigFromCurrentVis.layout).toEqual(
                expectedLayout
            )
        })
    }
)
