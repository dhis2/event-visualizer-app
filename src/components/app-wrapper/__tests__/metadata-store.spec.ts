import { expect, describe, it } from 'vitest'
import inpatientCasesVisualization from '../__fixtures__/-visualization-inpatient-cases-last-quarter-case.json'
import inpatientVisitVisualization from '../__fixtures__/visualization-inpatient-visit-overview-this-year-bo.json'
import { getInitialMetadata, type MetadataStoreItem } from '../metadata-helpers'
import { MetadataStore } from '../metadata-store'
import type { AppCachedData, SavedVisualization } from '@types'

class TestMetadataStore extends MetadataStore {
    getMetadataSnapshot(): Record<string, MetadataStoreItem> {
        return Object.fromEntries(this.metadataMap)
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
            "BIMONTHS_THIS_YEAR": {
              "id": "BIMONTHS_THIS_YEAR",
              "name": "Bimonths this year",
            },
            "GieVkTxp4HH": {
              "id": "GieVkTxp4HH",
              "name": "Height in cm",
              "options": [],
              "style": {},
            },
            "HS8QXAJtuKV": {
              "id": "HS8QXAJtuKV",
              "name": "Inpatient bed days average",
              "options": [],
              "style": {},
            },
            "ImspTQPwCqd": {
              "displayName": "Sierra Leone",
              "id": "ImspTQPwCqd",
              "name": "Sierra Leone",
              "path": "/ImspTQPwCqd",
            },
            "K6uUAvq500H": {
              "id": "K6uUAvq500H",
              "name": "Diagnosis (ICD-10)",
              "options": [],
              "style": {},
            },
            "Kswd1r4qWLh": {
              "id": "Kswd1r4qWLh",
              "name": "Average height of boys at 10 years old",
              "options": [],
              "style": {},
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
            "QUARTERS_THIS_YEAR": {
              "id": "QUARTERS_THIS_YEAR",
              "name": "Quarters this year",
            },
            "SWfdB5lX0fk": {
              "id": "SWfdB5lX0fk",
              "name": "Pregnant",
              "options": [],
              "style": {},
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
              "id": "Thkx2BnO5Kq",
              "name": "BMI male",
              "options": [],
              "style": {},
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
              "id": "XCMi7Wvnplm",
              "name": "BMI female",
              "options": [],
              "style": {},
            },
            "Y7hKDSuqEtH": {
              "id": "Y7hKDSuqEtH",
              "name": "BMI male under 5 y",
              "options": [],
              "style": {},
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
            "eBAyeGv0exc": {
              "displayIncidentDate": false,
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
            "eMyVanycQSC": {
              "id": "eMyVanycQSC",
              "name": "Admission Date",
              "options": [],
              "style": {},
            },
            "fWIAEtYVEGk": {
              "id": "fWIAEtYVEGk",
              "name": "Mode of Discharge",
              "options": [],
              "style": {},
            },
            "gWxh7DiRmG7": {
              "id": "gWxh7DiRmG7",
              "name": "Average height of girls at 5 years old",
              "options": [],
              "style": {},
            },
            "hlPt8H4bUOQ": {
              "id": "hlPt8H4bUOQ",
              "name": "BMI female under 5 y",
              "options": [],
              "style": {},
            },
            "msodh3rEMJa": {
              "id": "msodh3rEMJa",
              "name": "Discharge Date",
              "options": [],
              "style": {},
            },
            "oZg33kd9taw": {
              "id": "oZg33kd9taw",
              "name": "Gender",
              "options": [],
              "style": {},
            },
            "qrur9Dvnyt5": {
              "id": "qrur9Dvnyt5",
              "name": "Age in years",
              "options": [],
              "style": {},
            },
            "sGna2pquXOO": {
              "id": "sGna2pquXOO",
              "name": "Average age of female discharges",
              "options": [],
              "style": {},
            },
            "tUdBD1JDxpn": {
              "id": "tUdBD1JDxpn",
              "name": "Average age of deaths",
              "options": [],
              "style": {},
            },
            "vV9UWAZohSf": {
              "id": "vV9UWAZohSf",
              "name": "Weight in kg",
              "options": [],
              "style": {},
            },
            "x7PaHGvgWY2": {
              "id": "x7PaHGvgWY2",
              "name": "BMI",
              "options": [],
              "style": {},
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
        expect(snapshot0Keys.size).toBe(37)
        expect(snapshot1Keys.size).toBe(58)
        expect(snapshot2Keys.size).toBe(45)

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
            "SWfdB5lX0fk",
            "vV9UWAZohSf",
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
            "qrur9Dvnyt5",
            "K6uUAvq500H",
            "msodh3rEMJa",
            "oZg33kd9taw",
            "fWIAEtYVEGk",
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
})
