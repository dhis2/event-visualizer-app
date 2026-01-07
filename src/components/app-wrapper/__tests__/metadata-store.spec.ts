import { expect, describe, it, beforeEach } from 'vitest'
import inpatientCasesVisualization from '../__fixtures__/-visualization-inpatient-cases-last-quarter-case.json'
import inpatientVisitVisualization from '../__fixtures__/visualization-inpatient-visit-overview-this-year-bo.json'
import { getInitialMetadata } from '../metadata-helpers/initial-metadata'
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
              "dimensionType": "DATA_ELEMENT",
              "id": "GieVkTxp4HH",
              "name": "Height in cm",
              "valueType": "NUMBER",
            },
            "HS8QXAJtuKV": {
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
              "dimensionType": "DATA_ELEMENT",
              "id": "K6uUAvq500H",
              "name": "Diagnosis (ICD-10)",
              "optionSet": "eUZ79clX7y1",
              "valueType": "TEXT",
            },
            "Kswd1r4qWLh": {
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
              "dimensionType": "PROGRAM_INDICATOR",
              "id": "XCMi7Wvnplm",
              "name": "BMI female",
            },
            "Y7hKDSuqEtH": {
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
            "completedDate": {
              "dimensionType": "PERIOD",
              "id": "completedDate",
              "name": "Completed date",
            },
            "created": {
              "dimensionType": "PERIOD",
              "id": "created",
              "name": "Registration date",
            },
            "createdBy": {
              "dimensionType": "USER",
              "id": "createdBy",
              "name": "Created by",
            },
            "createdDate": {
              "dimensionType": "PERIOD",
              "id": "createdDate",
              "name": "Created date",
            },
            "eBAyeGv0exc": {
              "displayIncidentDate": false,
              "displayIncidentDateLabel": "Date of Discharge",
              "id": "eBAyeGv0exc",
              "name": "Inpatient morbidity and mortality",
              "programStages": [
                {
                  "id": "Zj7UnCAulEk",
                  "name": "Inpatient morbidity and mortality",
                  "repeatable": false,
                },
              ],
              "programType": "WITHOUT_REGISTRATION",
            },
            "eBAyeGv0exc.eventStatus": {
              "dimensionType": "STATUS",
              "id": "eBAyeGv0exc.eventStatus",
              "name": "Event status",
            },
            "eBAyeGv0exc.ou": {
              "dimensionType": "ORGANISATION_UNIT",
              "id": "eBAyeGv0exc.ou",
              "name": "Organisation unit",
            },
            "eBAyeGv0exc.programStatus": {
              "dimensionType": "STATUS",
              "id": "eBAyeGv0exc.programStatus",
              "name": "Program status",
            },
            "eMyVanycQSC": {
              "code": "DE_3000005",
              "dimensionType": "DATA_ELEMENT",
              "id": "eMyVanycQSC",
              "name": "Admission Date",
              "valueType": "DATE",
            },
            "enrollmentDate": {
              "dimensionType": "PERIOD",
              "id": "enrollmentDate",
              "name": "Enrollment date",
            },
            "eventDate": {
              "dimensionType": "PERIOD",
              "id": "eventDate",
              "name": "Report date",
            },
            "eventStatus": {
              "dimensionType": "STATUS",
              "id": "eventStatus",
              "name": "Event status",
            },
            "fWIAEtYVEGk": {
              "code": "DE_3000009",
              "dimensionType": "DATA_ELEMENT",
              "id": "fWIAEtYVEGk",
              "name": "Mode of Discharge",
              "optionSet": "iDFPKpFTiVw",
              "valueType": "TEXT",
            },
            "gWxh7DiRmG7": {
              "dimensionType": "PROGRAM_INDICATOR",
              "id": "gWxh7DiRmG7",
              "name": "Average height of girls at 5 years old",
            },
            "hlPt8H4bUOQ": {
              "dimensionType": "PROGRAM_INDICATOR",
              "id": "hlPt8H4bUOQ",
              "name": "BMI female under 5 y",
            },
            "incidentDate": {
              "dimensionType": "PERIOD",
              "id": "incidentDate",
              "name": "Date of Discharge",
            },
            "lastUpdated": {
              "dimensionType": "PERIOD",
              "id": "lastUpdated",
              "name": "Last updated on",
            },
            "lastUpdatedBy": {
              "dimensionType": "USER",
              "id": "lastUpdatedBy",
              "name": "Last updated by",
            },
            "lastUpdatedOn": {
              "dimensionType": "PERIOD",
              "id": "lastUpdatedOn",
              "name": "Last updated on",
            },
            "msodh3rEMJa": {
              "code": "DE_3000006",
              "dimensionType": "DATA_ELEMENT",
              "id": "msodh3rEMJa",
              "name": "Discharge Date",
              "valueType": "DATE",
            },
            "oZg33kd9taw": {
              "code": "DE_3000004",
              "dimensionType": "DATA_ELEMENT",
              "id": "oZg33kd9taw",
              "name": "Gender",
              "optionSet": "pC3N9N77UmT",
              "valueType": "TEXT",
            },
            "ou": {
              "dimensionType": "ORGANISATION_UNIT",
              "id": "ou",
              "name": "Organisation unit",
            },
            "programStatus": {
              "dimensionType": "STATUS",
              "id": "programStatus",
              "name": "Program status",
            },
            "qrur9Dvnyt5": {
              "code": "DE_3000003",
              "dimensionType": "DATA_ELEMENT",
              "id": "qrur9Dvnyt5",
              "name": "Age in years",
              "valueType": "INTEGER",
            },
            "sGna2pquXOO": {
              "dimensionType": "PROGRAM_INDICATOR",
              "id": "sGna2pquXOO",
              "name": "Average age of female discharges",
            },
            "scheduledDate": {
              "dimensionType": "PERIOD",
              "id": "scheduledDate",
              "name": "Scheduled date",
            },
            "tUdBD1JDxpn": {
              "dimensionType": "PROGRAM_INDICATOR",
              "id": "tUdBD1JDxpn",
              "name": "Average age of deaths",
            },
            "vV9UWAZohSf": {
              "code": "DE_240795",
              "dimensionType": "DATA_ELEMENT",
              "id": "vV9UWAZohSf",
              "name": "Weight in kg",
              "valueType": "INTEGER_POSITIVE",
            },
            "x7PaHGvgWY2": {
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
        expect(snapshot0Keys.size).toBe(52)
        expect(snapshot1Keys.size).toBe(80)
        expect(snapshot2Keys.size).toBe(66)

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
            "eBAyeGv0exc.ou",
            "eBAyeGv0exc.eventStatus",
            "eBAyeGv0exc.programStatus",
            "eBAyeGv0exc",
            "Zj7UnCAulEk",
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
                'dataElement.programStage1': {
                    uid: 'originalUid',
                    name: 'Nested Data Element',
                    valueType: 'TEXT',
                },
            }
            const dimensions = {}
            const headers: Array<LineListAnalyticsDataHeader> = []

            metadataStore.addAnalyticsResponseMetadata(
                analyticsItems,
                dimensions,
                headers
            )

            const snapshot = metadataStore.getMetadataSnapshot()
            expect(snapshot['dataElement.programStage1']).toEqual({
                id: 'dataElement.programStage1',
                name: 'Nested Data Element',
                valueType: 'TEXT',
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
            const dimensions = {}
            const headers: Array<LineListAnalyticsDataHeader> = []

            metadataStore.addAnalyticsResponseMetadata(
                analyticsItems,
                dimensions,
                headers
            )

            const snapshot = metadataStore.getMetadataSnapshot()
            expect(snapshot.regularItem).toEqual({
                id: 'regularItem',
                name: 'Regular Item',
                valueType: 'NUMBER',
            })
        })

        it('adds legend set metadata when data element has legendSet', () => {
            const legendSetId = 'legendSet123'
            const analyticsItems = {
                dataElement1: {
                    uid: 'dataElement1',
                    name: 'Data Element with Legend',
                    valueType: 'NUMBER',
                    legendSet: legendSetId,
                },
                legend1: {
                    uid: 'legend1',
                    name: 'Legend 1',
                },
                legend2: {
                    uid: 'legend2',
                    name: 'Legend 2',
                },
            }
            const dimensions = {
                dataElement1: ['legend1', 'legend2'],
            }
            const headers: Array<LineListAnalyticsDataHeader> = []

            metadataStore.addAnalyticsResponseMetadata(
                analyticsItems,
                dimensions,
                headers
            )

            const snapshot = metadataStore.getMetadataSnapshot()
            expect(snapshot.dataElement1).toEqual({
                id: 'dataElement1',
                name: 'Data Element with Legend',
                valueType: 'NUMBER',
                legendSet: legendSetId,
            })
            expect(snapshot[legendSetId]).toEqual({
                id: legendSetId,
                legends: [
                    { id: 'legend1', name: 'Legend 1' },
                    { id: 'legend2', name: 'Legend 2' },
                ],
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
            const dimensions = {}
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

            metadataStore.addAnalyticsResponseMetadata(
                analyticsItems,
                dimensions,
                headers
            )

            const snapshot = metadataStore.getMetadataSnapshot()
            expect(snapshot.ou).toEqual({
                id: 'ou',
                name: 'Organisation Unit UPDATED',
                valueType: 'TEXT',
                dimensionType: 'ORGANISATION_UNIT',
            })
        })

        it('creates new metadata items from headers when not present', () => {
            const analyticsItems = {}
            const dimensions = {}
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

            metadataStore.addAnalyticsResponseMetadata(
                analyticsItems,
                dimensions,
                headers
            )

            const snapshot = metadataStore.getMetadataSnapshot()
            expect(snapshot.eventDate).toEqual({
                id: 'eventDate',
                name: 'Report date',
                dimensionType: 'PERIOD',
            })
        })
    })
})
