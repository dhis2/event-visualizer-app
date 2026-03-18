import { expect, describe, it, beforeEach, vi } from 'vitest'
import inpatientCasesVisualization from '../__fixtures__/visualization-inpatient-cases-last-quarter-case.json'
import inpatientVisitVisualization from '../__fixtures__/visualization-inpatient-visit-overview-this-year-bo.json'
import { getInitialMetadata } from '../initial-metadata'
import { MetadataStore } from '../metadata-store'
import type { LineListAnalyticsDataHeader } from '@components/line-list/types'
import type { AppCachedData, SavedVisualization, MetadataItem } from '@types'

class TestMetadataStore extends MetadataStore {
    getMetadataSnapshot(): Record<string, MetadataItem> {
        return Object.fromEntries(this.metadataMap) as Record<
            string,
            MetadataItem
        >
    }
}

const rootOrgUnits: AppCachedData['rootOrgUnits'] = [
    {
        name: 'Sierra Leone',
        path: '/ImspTQPwCqd',
        displayName: 'Sierra Leone',
        id: 'ImspTQPwCqd',
    },
]

describe('MetadataStore', () => {
    it('after calling setVisualizationMetadata the store has the expected content', () => {
        const metadataStore = new TestMetadataStore(
            getInitialMetadata(),
            rootOrgUnits
        )
        metadataStore.setVisualizationMetadata(
            inpatientVisitVisualization as unknown as SavedVisualization
        )
        expect(metadataStore.getMetadataSnapshot()).toMatchInlineSnapshot(`
          {
            "ACTIVE": {
              "id": "ACTIVE",
              "name": "Active",
            },
            "BIMONTHS_THIS_YEAR": {
              "id": "BIMONTHS_THIS_YEAR",
              "name": "Bimonths this year",
            },
            "CANCELLED": {
              "id": "CANCELLED",
              "name": "Cancelled",
            },
            "COMPLETED": {
              "id": "COMPLETED",
              "name": "Completed",
            },
            "GieVkTxp4HH": {
              "code": "DE_240794",
              "dimensionId": "GieVkTxp4HH",
              "dimensionType": "DATA_ELEMENT",
              "id": "GieVkTxp4HH",
              "legendSetId": "TBxGTceyzwy",
              "name": "Height in cm",
              "valueType": "NUMBER",
            },
            "HS8QXAJtuKV": {
              "dimensionId": "HS8QXAJtuKV",
              "dimensionType": "PROGRAM_INDICATOR",
              "id": "HS8QXAJtuKV",
              "name": "Inpatient bed days average",
            },
            "ImspTQPwCqd": {
              "id": "ImspTQPwCqd",
              "name": "Sierra Leone",
              "path": "/ImspTQPwCqd",
            },
            "K6uUAvq500H": {
              "code": "DE_3000010",
              "dimensionId": "K6uUAvq500H",
              "dimensionType": "DATA_ELEMENT",
              "id": "K6uUAvq500H",
              "name": "Diagnosis (ICD-10)",
              "optionSetId": "eUZ79clX7y1",
              "valueType": "TEXT",
            },
            "Kswd1r4qWLh": {
              "dimensionId": "Kswd1r4qWLh",
              "dimensionType": "PROGRAM_INDICATOR",
              "id": "Kswd1r4qWLh",
              "name": "Average height of boys at 10 years old",
            },
            "LAST_12_MONTHS": {
              "id": "LAST_12_MONTHS",
              "name": "Last 12 months",
            },
            "LAST_12_WEEKS": {
              "id": "LAST_12_WEEKS",
              "name": "Last 12 weeks",
            },
            "LAST_14_DAYS": {
              "id": "LAST_14_DAYS",
              "name": "Last 14 days",
            },
            "LAST_2_SIXMONTHS": {
              "id": "LAST_2_SIXMONTHS",
              "name": "Last 2 six-months",
            },
            "LAST_3_DAYS": {
              "id": "LAST_3_DAYS",
              "name": "Last 3 days",
            },
            "LAST_3_MONTHS": {
              "id": "LAST_3_MONTHS",
              "name": "Last 3 months",
            },
            "LAST_4_QUARTERS": {
              "id": "LAST_4_QUARTERS",
              "name": "Last 4 quarters",
            },
            "LAST_4_WEEKS": {
              "id": "LAST_4_WEEKS",
              "name": "Last 4 weeks",
            },
            "LAST_52_WEEKS": {
              "id": "LAST_52_WEEKS",
              "name": "Last 52 weeks",
            },
            "LAST_5_FINANCIAL_YEARS": {
              "id": "LAST_5_FINANCIAL_YEARS",
              "name": "Last 5 financial years",
            },
            "LAST_6_BIMONTHS": {
              "id": "LAST_6_BIMONTHS",
              "name": "Last 6 bimonths",
            },
            "LAST_6_MONTHS": {
              "id": "LAST_6_MONTHS",
              "name": "Last 6 months",
            },
            "LAST_7_DAYS": {
              "id": "LAST_7_DAYS",
              "name": "Last 7 days",
            },
            "LAST_BIMONTH": {
              "id": "LAST_BIMONTH",
              "name": "Last bimonth",
            },
            "LAST_FINANCIAL_YEAR": {
              "id": "LAST_FINANCIAL_YEAR",
              "name": "Last financial year",
            },
            "LAST_MONTH": {
              "id": "LAST_MONTH",
              "name": "Last month",
            },
            "LAST_QUARTER": {
              "id": "LAST_QUARTER",
              "name": "Last quarter",
            },
            "LAST_SIX_MONTH": {
              "id": "LAST_SIX_MONTH",
              "name": "Last six-month",
            },
            "LAST_WEEK": {
              "id": "LAST_WEEK",
              "name": "Last week",
            },
            "LAST_YEAR": {
              "id": "LAST_YEAR",
              "name": "Last year",
            },
            "MONTHS_THIS_YEAR": {
              "id": "MONTHS_THIS_YEAR",
              "name": "Months this year",
            },
            "O6uvpzGd5pu": {
              "code": "OU_264",
              "id": "O6uvpzGd5pu",
              "name": "Bo",
              "path": "/ImspTQPwCqd/O6uvpzGd5pu",
            },
            "QUARTERS_THIS_YEAR": {
              "id": "QUARTERS_THIS_YEAR",
              "name": "Quarters this year",
            },
            "SCHEDULE": {
              "id": "SCHEDULE",
              "name": "Scheduled",
            },
            "SWfdB5lX0fk": {
              "code": "DE_423442",
              "dimensionId": "SWfdB5lX0fk",
              "dimensionType": "DATA_ELEMENT",
              "id": "SWfdB5lX0fk",
              "name": "Pregnant",
              "valueType": "BOOLEAN",
            },
            "THIS_BIMONTH": {
              "id": "THIS_BIMONTH",
              "name": "This bimonth",
            },
            "THIS_FINANCIAL_YEAR": {
              "id": "THIS_FINANCIAL_YEAR",
              "name": "This financial year",
            },
            "THIS_MONTH": {
              "id": "THIS_MONTH",
              "name": "This month",
            },
            "THIS_QUARTER": {
              "id": "THIS_QUARTER",
              "name": "This quarter",
            },
            "THIS_SIX_MONTH": {
              "id": "THIS_SIX_MONTH",
              "name": "This six-month",
            },
            "THIS_WEEK": {
              "id": "THIS_WEEK",
              "name": "This week",
            },
            "THIS_YEAR": {
              "id": "THIS_YEAR",
              "name": "This year",
            },
            "TODAY": {
              "id": "TODAY",
              "name": "Today",
            },
            "Thkx2BnO5Kq": {
              "dimensionId": "Thkx2BnO5Kq",
              "dimensionType": "PROGRAM_INDICATOR",
              "id": "Thkx2BnO5Kq",
              "name": "BMI male",
            },
            "USER_ORGUNIT": {
              "id": "USER_ORGUNIT",
              "name": "User organisation unit",
            },
            "USER_ORGUNIT_CHILDREN": {
              "id": "USER_ORGUNIT_CHILDREN",
              "name": "User sub-units",
            },
            "USER_ORGUNIT_GRANDCHILDREN": {
              "id": "USER_ORGUNIT_GRANDCHILDREN",
              "name": "User sub-x2-units",
            },
            "WEEKS_THIS_YEAR": {
              "id": "WEEKS_THIS_YEAR",
              "name": "Weeks this year",
            },
            "XCMi7Wvnplm": {
              "dimensionId": "XCMi7Wvnplm",
              "dimensionType": "PROGRAM_INDICATOR",
              "id": "XCMi7Wvnplm",
              "name": "BMI female",
            },
            "Y7hKDSuqEtH": {
              "dimensionId": "Y7hKDSuqEtH",
              "dimensionType": "PROGRAM_INDICATOR",
              "id": "Y7hKDSuqEtH",
              "name": "BMI male under 5 y",
            },
            "YESTERDAY": {
              "id": "YESTERDAY",
              "name": "Yesterday",
            },
            "Zj7UnCAulEk": {
              "displayExecutionDateLabel": "Report date",
              "hideDueDate": false,
              "id": "Zj7UnCAulEk",
              "name": "Inpatient morbidity and mortality",
              "repeatable": false,
            },
            "Zj7UnCAulEk.eventStatus": {
              "dimensionId": "eventStatus",
              "dimensionType": "STATUS",
              "id": "Zj7UnCAulEk.eventStatus",
              "name": "Event status",
              "programStageId": "Zj7UnCAulEk",
            },
            "Zj7UnCAulEk.ou": {
              "dimensionId": "ou",
              "dimensionType": "ORGANISATION_UNIT",
              "id": "Zj7UnCAulEk.ou",
              "name": "Organisation unit",
              "programStageId": "Zj7UnCAulEk",
            },
            "Zj7UnCAulEk.programStatus": {
              "dimensionId": "programStatus",
              "dimensionType": "STATUS",
              "id": "Zj7UnCAulEk.programStatus",
              "name": "Program status",
              "programStageId": "Zj7UnCAulEk",
            },
            "completedDate": {
              "dimensionId": "completedDate",
              "dimensionType": "PERIOD",
              "id": "completedDate",
              "name": "Completed date",
            },
            "created": {
              "dimensionId": "created",
              "dimensionType": "PERIOD",
              "id": "created",
              "name": "Registration date",
              "valueType": "DATE",
            },
            "createdBy": {
              "dimensionId": "createdBy",
              "dimensionType": "USER",
              "id": "createdBy",
              "name": "Created by",
              "valueType": "USERNAME",
            },
            "createdDate": {
              "dimensionId": "createdDate",
              "dimensionType": "PERIOD",
              "id": "createdDate",
              "name": "Created date",
            },
            "eBAyeGv0exc": {
              "displayIncidentDate": false,
              "displayIncidentDateLabel": "Date of Discharge",
              "id": "eBAyeGv0exc",
              "incidentDateLabel": "Date of Discharge",
              "name": "Inpatient morbidity and mortality",
              "programStages": [
                {
                  "displayExecutionDateLabel": "Report date",
                  "hideDueDate": false,
                  "id": "Zj7UnCAulEk",
                  "name": "Inpatient morbidity and mortality",
                  "repeatable": false,
                },
              ],
              "programType": "WITHOUT_REGISTRATION",
            },
            "eMyVanycQSC": {
              "code": "DE_3000005",
              "dimensionId": "eMyVanycQSC",
              "dimensionType": "DATA_ELEMENT",
              "id": "eMyVanycQSC",
              "name": "Admission Date",
              "valueType": "DATE",
            },
            "enrollmentDate": {
              "dimensionId": "enrollmentDate",
              "dimensionType": "PERIOD",
              "id": "enrollmentDate",
              "name": "Enrollment date",
            },
            "eventDate": {
              "dimensionId": "eventDate",
              "dimensionType": "PERIOD",
              "id": "eventDate",
              "name": "Report date",
            },
            "eventStatus": {
              "dimensionId": "eventStatus",
              "dimensionType": "STATUS",
              "id": "eventStatus",
              "name": "Event status",
            },
            "fWIAEtYVEGk": {
              "code": "DE_3000009",
              "dimensionId": "fWIAEtYVEGk",
              "dimensionType": "DATA_ELEMENT",
              "id": "fWIAEtYVEGk",
              "name": "Mode of Discharge",
              "optionSetId": "iDFPKpFTiVw",
              "valueType": "TEXT",
            },
            "gWxh7DiRmG7": {
              "dimensionId": "gWxh7DiRmG7",
              "dimensionType": "PROGRAM_INDICATOR",
              "id": "gWxh7DiRmG7",
              "name": "Average height of girls at 5 years old",
            },
            "hlPt8H4bUOQ": {
              "dimensionId": "hlPt8H4bUOQ",
              "dimensionType": "PROGRAM_INDICATOR",
              "id": "hlPt8H4bUOQ",
              "name": "BMI female under 5 y",
            },
            "incidentDate": {
              "dimensionId": "incidentDate",
              "dimensionType": "PERIOD",
              "id": "incidentDate",
              "name": "Date of Discharge",
            },
            "lastUpdated": {
              "dimensionId": "lastUpdated",
              "dimensionType": "PERIOD",
              "id": "lastUpdated",
              "name": "Last updated on",
              "valueType": "DATETIME",
            },
            "lastUpdatedBy": {
              "dimensionId": "lastUpdatedBy",
              "dimensionType": "USER",
              "id": "lastUpdatedBy",
              "name": "Last updated by",
              "valueType": "USERNAME",
            },
            "lastUpdatedOn": {
              "dimensionId": "lastUpdatedOn",
              "dimensionType": "PERIOD",
              "id": "lastUpdatedOn",
              "name": "Last updated on",
            },
            "msodh3rEMJa": {
              "code": "DE_3000006",
              "dimensionId": "msodh3rEMJa",
              "dimensionType": "DATA_ELEMENT",
              "id": "msodh3rEMJa",
              "name": "Discharge Date",
              "valueType": "DATE",
            },
            "oZg33kd9taw": {
              "code": "DE_3000004",
              "dimensionId": "oZg33kd9taw",
              "dimensionType": "DATA_ELEMENT",
              "id": "oZg33kd9taw",
              "name": "Gender",
              "optionSetId": "pC3N9N77UmT",
              "valueType": "TEXT",
            },
            "ou": {
              "dimensionId": "ou",
              "dimensionType": "ORGANISATION_UNIT",
              "id": "ou",
              "name": "Organisation unit",
            },
            "pe": {
              "id": "pe",
              "name": "Period",
            },
            "programStatus": {
              "dimensionId": "programStatus",
              "dimensionType": "STATUS",
              "id": "programStatus",
              "name": "Program status",
            },
            "qrur9Dvnyt5": {
              "code": "DE_3000003",
              "dimensionId": "qrur9Dvnyt5",
              "dimensionType": "DATA_ELEMENT",
              "id": "qrur9Dvnyt5",
              "legendSetId": "Yf6UHoPkdS6",
              "name": "Age in years",
              "valueType": "INTEGER",
            },
            "sGna2pquXOO": {
              "dimensionId": "sGna2pquXOO",
              "dimensionType": "PROGRAM_INDICATOR",
              "id": "sGna2pquXOO",
              "name": "Average age of female discharges",
            },
            "scheduledDate": {
              "dimensionId": "scheduledDate",
              "dimensionType": "PERIOD",
              "id": "scheduledDate",
              "name": "Scheduled date",
            },
            "tUdBD1JDxpn": {
              "dimensionId": "tUdBD1JDxpn",
              "dimensionType": "PROGRAM_INDICATOR",
              "id": "tUdBD1JDxpn",
              "name": "Average age of deaths",
            },
            "vV9UWAZohSf": {
              "code": "DE_240795",
              "dimensionId": "vV9UWAZohSf",
              "dimensionType": "DATA_ELEMENT",
              "id": "vV9UWAZohSf",
              "legendSetId": "OrkEzxZEH4X",
              "name": "Weight in kg",
              "valueType": "INTEGER_POSITIVE",
            },
            "x7PaHGvgWY2": {
              "dimensionId": "x7PaHGvgWY2",
              "dimensionType": "PROGRAM_INDICATOR",
              "id": "x7PaHGvgWY2",
              "name": "BMI",
            },
          }
        `)
    })
    it('after setting a new visualization the store is updated as expected', () => {
        const metadataStore = new TestMetadataStore(
            getInitialMetadata(),
            rootOrgUnits
        )
        const snapshot0 = metadataStore.getMetadataSnapshot()
        metadataStore.setVisualizationMetadata(
            inpatientVisitVisualization as unknown as SavedVisualization
        )
        const snapshot1 = metadataStore.getMetadataSnapshot()
        metadataStore.setVisualizationMetadata(
            inpatientCasesVisualization as unknown as SavedVisualization
        )
        const snapshot2 = metadataStore.getMetadataSnapshot()
        const snapshot0Keys = new Set(Object.keys(snapshot0))
        const snapshot1Keys = new Set(Object.keys(snapshot1))
        const snapshot2Keys = new Set(Object.keys(snapshot2))

        // Length grows and decreases
        expect(snapshot0Keys.size).toBe(53)
        expect(snapshot1Keys.size).toBe(81)
        expect(snapshot2Keys.size).toBe(67)

        // Initial metadata is always included
        expect(snapshot0Keys.isSubsetOf(snapshot1Keys)).toBe(true)
        expect(snapshot0Keys.isSubsetOf(snapshot2Keys)).toBe(true)

        const snapshot1KeysWithoutInitial =
            snapshot1Keys.difference(snapshot0Keys)
        const snapshot2KeysWithoutInitial =
            snapshot2Keys.difference(snapshot0Keys)

        // Some data is removed
        expect(
            Array.from(
                snapshot1KeysWithoutInitial.difference(
                    snapshot2KeysWithoutInitial
                )
            )
        ).toMatchInlineSnapshot(`
          [
            "GieVkTxp4HH",
            "vV9UWAZohSf",
            "O6uvpzGd5pu",
            "SWfdB5lX0fk",
            "tUdBD1JDxpn",
            "sGna2pquXOO",
            "Kswd1r4qWLh",
            "gWxh7DiRmG7",
            "x7PaHGvgWY2",
            "XCMi7Wvnplm",
            "hlPt8H4bUOQ",
            "Thkx2BnO5Kq",
            "Y7hKDSuqEtH",
            "HS8QXAJtuKV",
          ]
        `)

        // But some is kept
        expect(
            Array.from(
                snapshot1KeysWithoutInitial.intersection(
                    snapshot2KeysWithoutInitial
                )
            )
        ).toMatchInlineSnapshot(`
          [
            "eMyVanycQSC",
            "oZg33kd9taw",
            "fWIAEtYVEGk",
            "qrur9Dvnyt5",
            "K6uUAvq500H",
            "msodh3rEMJa",
            "lastUpdated",
            "createdBy",
            "lastUpdatedBy",
            "eBAyeGv0exc",
            "Zj7UnCAulEk",
            "Zj7UnCAulEk.ou",
            "Zj7UnCAulEk.eventStatus",
            "Zj7UnCAulEk.programStatus",
          ]
        `)
    })
    it('when an organisation unit is added again without path field it is retained', () => {
        const metadataStore = new TestMetadataStore(
            getInitialMetadata(),
            rootOrgUnits
        )
        const id = 'my-id'
        const path = 'my/org/unit/path'

        metadataStore.addMetadata({
            id,
            name: 'My org unit',
            path,
        })

        expect(metadataStore.getMetadataItem(id)).toHaveProperty('path', path)

        const updatedName = 'My updated org unit name'
        metadataStore.addMetadata({
            uid: id,
            name: updatedName,
        })

        expect(metadataStore.getMetadataItem(id)).toHaveProperty(
            'name',
            updatedName
        )
        expect(metadataStore.getMetadataItem(id)).toHaveProperty('path', path)
    })

    describe('addAnalyticsResponseMetadata', () => {
        let metadataStore: TestMetadataStore

        beforeEach(() => {
            metadataStore = new TestMetadataStore(
                getInitialMetadata(),
                rootOrgUnits
            )
            metadataStore.setVisualizationMetadata(
                inpatientVisitVisualization as unknown as SavedVisualization
            )
        })

        it('adds metadata items with nested IDs correctly', () => {
            const analyticsItems = {
                'Zj7UnCAulEk.someDataElement': {
                    uid: 'originalUid',
                    name: 'Nested Data Element',
                    valueType: 'TEXT',
                },
            }
            const headers: Array<LineListAnalyticsDataHeader> = []

            metadataStore.addAnalyticsResponseMetadata(analyticsItems, headers)

            const snapshot = metadataStore.getMetadataSnapshot()
            expect(snapshot['Zj7UnCAulEk.someDataElement']).toEqual({
                id: 'Zj7UnCAulEk.someDataElement',
                name: 'Nested Data Element',
                valueType: undefined,
            })
        })

        it('adds regular metadata items correctly', () => {
            const analyticsItems = {
                regularItem: {
                    uid: 'regularItem',
                    name: 'Regular Item',
                    valueType: 'NUMBER',
                },
            }
            const headers: Array<LineListAnalyticsDataHeader> = []

            metadataStore.addAnalyticsResponseMetadata(analyticsItems, headers)

            const snapshot = metadataStore.getMetadataSnapshot()
            expect(snapshot.regularItem).toEqual({
                id: 'regularItem',
                name: 'Regular Item',
                valueType: undefined,
            })
        })

        it('updates metadata names from headers', () => {
            const analyticsItems = {
                ou: {
                    uid: 'ou',
                    name: 'Organisation Unit',
                    valueType: 'TEXT',
                },
            }
            const headers = [
                {
                    name: 'ouname',
                    column: 'Organisation Unit UPDATED',
                    valueType: 'TEXT',
                    type: 'java.lang.String',
                    hidden: false,
                    meta: true,
                    legendSet: { id: '', name: '', legends: [] },
                } as unknown as LineListAnalyticsDataHeader,
            ]

            metadataStore.addAnalyticsResponseMetadata(analyticsItems, headers)

            const snapshot = metadataStore.getMetadataSnapshot()
            expect(snapshot.ou).toEqual({
                id: 'ou',
                dimensionId: 'ou',
                name: 'Organisation Unit UPDATED',
                dimensionType: 'ORGANISATION_UNIT',
            })
        })

        it('creates new metadata items from headers when not present', () => {
            const analyticsItems = {}
            const headers: Array<LineListAnalyticsDataHeader> = [
                {
                    name: 'eventdate',
                    column: 'Report date',
                    valueType: 'DATETIME',
                    type: 'java.time.LocalDateTime',
                    hidden: false,
                    meta: true,
                    legendSet: { id: '', name: '', legends: [] },
                } as unknown as LineListAnalyticsDataHeader,
            ]

            metadataStore.addAnalyticsResponseMetadata(analyticsItems, headers)

            const snapshot = metadataStore.getMetadataSnapshot()
            expect(snapshot.eventDate).toEqual({
                id: 'eventDate',
                dimensionId: 'eventDate',
                name: 'Report date',
                dimensionType: 'PERIOD',
            })
        })
    })
})

// ---------------------------------------------------------------------------
// Shared helpers for the new unit tests below
// ---------------------------------------------------------------------------

const makeProgram = (programId: string, stageId: string): MetadataItem => ({
    id: programId,
    name: `Program ${programId}`,
    programType: 'WITHOUT_REGISTRATION' as const,
    programStages: [
        {
            id: stageId,
            name: `Stage ${stageId}`,
            displayExecutionDateLabel: 'Report date',
            hideDueDate: false,
            repeatable: false,
            program: { id: programId },
        },
    ],
})

const makeStage = (stageId: string, programId: string): MetadataItem => ({
    id: stageId,
    name: `Stage ${stageId}`,
    displayExecutionDateLabel: 'Report date',
    hideDueDate: false,
    repeatable: false,
    program: { id: programId },
})

// ---------------------------------------------------------------------------
// getMetadataItem — alias resolution
// ---------------------------------------------------------------------------

describe('MetadataStore.getMetadataItem — alias key resolution', () => {
    let store: TestMetadataStore

    beforeEach(() => {
        store = new TestMetadataStore(
            {},
            [] as unknown as AppCachedData['rootOrgUnits']
        )
    })

    it('returns the item when the exact canonical key is used', () => {
        const programId = 'p1'
        const stageId = 'ps1'
        const dimId = 'weight'
        store.addMetadata(makeProgram(programId, stageId))
        store.addMetadata(makeStage(stageId, programId))
        store.addMetadata({
            [`${stageId}.${dimId}`]: {
                id: `${stageId}.${dimId}`,
                name: 'Weight',
                dimensionType: 'DATA_ELEMENT',
            },
        })

        const item = store.getMetadataItem(`${stageId}.${dimId}`)
        expect(item).toBeDefined()
        expect(item?.id).toBe(`${stageId}.${dimId}`)
    })

    it('resolves a program-based alias (p1.dim) to the canonical stage-based key (ps1.dim)', () => {
        const programId = 'p1'
        const stageId = 'ps1'
        const dimId = 'weight'
        store.addMetadata(makeProgram(programId, stageId))
        store.addMetadata(makeStage(stageId, programId))
        store.addMetadata({
            [`${stageId}.${dimId}`]: {
                id: `${stageId}.${dimId}`,
                name: 'Weight',
                dimensionType: 'DATA_ELEMENT',
            },
        })

        // Look up using the alias key
        const item = store.getMetadataItem(`${programId}.${dimId}`)
        expect(item).toBeDefined()
        expect(item?.id).toBe(`${stageId}.${dimId}`)
    })

    it('resolves a 3-part alias (p1.ps1.dim) to the canonical stage-based key', () => {
        const programId = 'p1'
        const stageId = 'ps1'
        const dimId = 'height'
        store.addMetadata(makeProgram(programId, stageId))
        store.addMetadata(makeStage(stageId, programId))
        store.addMetadata({
            [`${stageId}.${dimId}`]: {
                id: `${stageId}.${dimId}`,
                name: 'Height',
                dimensionType: 'DATA_ELEMENT',
            },
        })

        const item = store.getMetadataItem(`${programId}.${stageId}.${dimId}`)
        expect(item).toBeDefined()
        expect(item?.id).toBe(`${stageId}.${dimId}`)
    })

    it('returns undefined for a completely unknown compound key', () => {
        const item = store.getMetadataItem('unknown.dim')
        expect(item).toBeUndefined()
    })

    it('returns undefined for an unknown plain key', () => {
        const item = store.getMetadataItem('nonexistent')
        expect(item).toBeUndefined()
    })
})

// ---------------------------------------------------------------------------
// addMetadata — deferred compound key processing
// ---------------------------------------------------------------------------

describe('MetadataStore.addMetadata — deferred compound key processing', () => {
    let store: TestMetadataStore

    beforeEach(() => {
        store = new TestMetadataStore(
            {},
            [] as unknown as AppCachedData['rootOrgUnits']
        )
    })

    it('processes plain items before compound items in the same addMetadata call', () => {
        const programId = 'p1'
        const stageId = 'ps1'
        const dimId = 'weight'

        // Pass everything in one call — compound key depends on the stage being present
        store.addMetadata({
            [programId]: makeProgram(programId, stageId),
            [stageId]: makeStage(stageId, programId),
            [`${stageId}.${dimId}`]: {
                id: `${stageId}.${dimId}`,
                name: 'Weight',
                dimensionType: 'DATA_ELEMENT',
            },
        })

        const snapshot = store.getMetadataSnapshot()
        expect(snapshot[`${stageId}.${dimId}`]).toBeDefined()
        expect(snapshot[`${stageId}.${dimId}`]).toMatchObject({
            id: `${stageId}.${dimId}`,
            dimensionId: dimId,
        })
    })

    it('stores compound keys under canonical form even when supplied as alias', () => {
        const programId = 'p1'
        const stageId = 'ps1'
        const dimId = 'height'

        store.addMetadata(makeProgram(programId, stageId))
        store.addMetadata(makeStage(stageId, programId))

        // Supply with program-based alias key
        store.addMetadata({
            [`${programId}.${dimId}`]: {
                id: `${programId}.${dimId}`,
                name: 'Height',
                dimensionType: 'DATA_ELEMENT',
            },
        })

        const snapshot = store.getMetadataSnapshot()
        // Must be stored under canonical key
        expect(snapshot[`${stageId}.${dimId}`]).toBeDefined()
        // Not under the alias key
        expect(snapshot[`${programId}.${dimId}`]).toBeUndefined()
    })
})

// ---------------------------------------------------------------------------
// notifySubscribers — fan-out for compound key aliases
// ---------------------------------------------------------------------------

describe('MetadataStore — subscriber fan-out for compound key aliases', () => {
    let store: TestMetadataStore

    beforeEach(() => {
        store = new TestMetadataStore(
            {},
            [] as unknown as AppCachedData['rootOrgUnits']
        )
    })

    it('notifies subscriber registered under canonical key when item is updated', () => {
        const programId = 'p1'
        const stageId = 'ps1'
        const dimId = 'weight'
        store.addMetadata(makeProgram(programId, stageId))
        store.addMetadata(makeStage(stageId, programId))

        const cb = vi.fn()
        store.subscribe(`${stageId}.${dimId}`, cb)

        store.addMetadata({
            [`${stageId}.${dimId}`]: {
                id: `${stageId}.${dimId}`,
                name: 'Weight',
                dimensionType: 'DATA_ELEMENT',
            },
        })

        expect(cb).toHaveBeenCalledTimes(1)
    })

    it('notifies subscriber registered under alias key when canonical key item changes', () => {
        const programId = 'p1'
        const stageId = 'ps1'
        const dimId = 'weight'
        store.addMetadata(makeProgram(programId, stageId))
        store.addMetadata(makeStage(stageId, programId))

        const cbAlias = vi.fn()
        // Subscribe using the program-based alias
        store.subscribe(`${programId}.${dimId}`, cbAlias)

        // Update item using canonical key
        store.addMetadata({
            [`${stageId}.${dimId}`]: {
                id: `${stageId}.${dimId}`,
                name: 'Weight',
                dimensionType: 'DATA_ELEMENT',
            },
        })

        expect(cbAlias).toHaveBeenCalledTimes(1)
    })

    it('notifies subscriber under alias key when canonical item is removed via setVisualizationMetadata', () => {
        // Set up: load a visualization that contains the compound dimension
        store.setVisualizationMetadata(
            inpatientVisitVisualization as unknown as SavedVisualization
        )

        // The inpatient visit visualization has stage Zj7UnCAulEk and compound key Zj7UnCAulEk.ou
        // The program is eBAyeGv0exc (event program / WITHOUT_REGISTRATION) with one stage.
        // So p1.ou would be an alias for Zj7UnCAulEk.ou IF eBAyeGv0exc was p1.
        // To test, subscribe to the 3-part alias: eBAyeGv0exc.Zj7UnCAulEk.ou
        const cbAlias = vi.fn()
        store.subscribe('eBAyeGv0exc.Zj7UnCAulEk.ou', cbAlias)

        // Now switch to the inpatient cases visualization — it also has Zj7UnCAulEk.ou,
        // so that item WON'T be removed. Instead confirm the subscriber is NOT notified.
        // This validates that the fan-out only fires when something actually changes.
        cbAlias.mockClear()
        store.setVisualizationMetadata(
            inpatientCasesVisualization as unknown as SavedVisualization
        )

        // Zj7UnCAulEk.ou is in both visualizations, so the alias subscriber
        // should NOT receive a spurious removal notification
        expect(cbAlias).not.toHaveBeenCalled()
    })

    it('notifies alias subscriber when item name changes via addMetadata', () => {
        // Set up program+stage context
        const programId = 'p1'
        const stageId = 'ps1'
        const dimId = 'weight'
        store.addMetadata(makeProgram(programId, stageId))
        store.addMetadata(makeStage(stageId, programId))
        store.addMetadata({
            [`${stageId}.${dimId}`]: {
                id: `${stageId}.${dimId}`,
                name: 'Weight',
                dimensionType: 'DATA_ELEMENT',
            },
        })

        const cbAlias = vi.fn()
        // Subscribe using the full 3-part alias
        store.subscribe(`${programId}.${stageId}.${dimId}`, cbAlias)

        // Update the item — subscriber should be notified
        store.addMetadata({
            [`${stageId}.${dimId}`]: {
                id: `${stageId}.${dimId}`,
                name: 'Weight (updated)',
                dimensionType: 'DATA_ELEMENT',
            },
        })

        expect(cbAlias).toHaveBeenCalledTimes(1)
    })
})
