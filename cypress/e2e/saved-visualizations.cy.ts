import { expectVisTitleToEqual } from '../helpers'
import { deleteInterpretations } from '../support/api'
import { pluginBody } from '../support/dashboard-plugin'
import { testObjectName } from '../support/names'
import type { ExpectedRendering } from '../support/rendering'
import { expectVisualizationToRender } from '../support/rendering'
import { getApiBaseUrl } from '../support/utils'

type SavedVisualization = ExpectedRendering & {
    covers: string
    id: string
    name: string
    skip?: boolean
}

const VISUALIZATIONS: SavedVisualization[] = [
    {
        covers: 'Event line list, event program',
        id: 't6SxiQdVPVs',
        name: 'E2E: Event line list, event program',
        type: 'LINE_LIST',
        headers: [
            'Event org. unit',
            'Report date',
            'Gender',
            'Age in years',
            'Weight in kg',
            'Mode of Discharge',
            'Inpatient bed days average',
            'Last updated on',
        ],
    },
    {
        covers: 'Event line list, one stage of a tracker program',
        id: 'IZJmG9NHTtj',
        name: 'EVER [Line list] [Event] Basic',
        type: 'LINE_LIST',
        headers: [
            'Event org. unit',
            'Report date',
            'Event status',
            'MCH Apgar Score',
        ],
    },
    {
        covers: 'Event line list, tracker stage with enrollment dimensions and attributes',
        id: 'C1XaMuNaeDy',
        name: 'Test option set options labels',
        type: 'LINE_LIST',
        headers: [
            'Event org. unit',
            'First name',
            'Last name',
            'WHOMCH Clinical impression of pre-eclampsia',
            'WHOMCH Confirmed or suspected infection',
            'WHOMCH Pain medication given',
        ],
    },
    {
        covers: 'Enrollment line list, one stage with enrollment dimensions',
        id: 'qSc4vbYPPgk',
        name: 'EVER [Line list] [Enrollment] Basic',
        type: 'LINE_LIST',
        headers: [
            'Enrollment org. unit',
            'Date of enrollment',
            'Enrollment status',
        ],
    },
    {
        covers: 'Enrollment line list, one stage with enrollment dimensions',
        id: 'C524QgkjodB',
        name: 'EVER [Line list] [Enrollment] Stage and enrollment dimensions',
        type: 'LINE_LIST',
        headers: [
            'Enrollment org. unit',
            'Date of enrollment',
            'Enrollment status',
            'Event org. unit',
            'Event status',
        ],
    },
    {
        covers: 'Enrollment line list, several stages of one program',
        id: 'kUbNtOy0T12',
        name: 'E2E: Enrollment line list, several stages',
        type: 'LINE_LIST',
        headers: [
            'Enrollment org. unit',
            'Date of enrollment',
            'Date of birth',
            'Enrollment status',
            'Gender',
            'MCH Weight (g) · Birth',
            'MCH ARV at birth · Birth',
            'MCH Infant Weight (g) · Baby Postnatal',
            'Scheduled date · Baby Postnatal',
            'Average weight (g)',
        ],
    },
    {
        covers: 'Enrollment line list, repeated events',
        id: 'XCLdIcUmenR',
        name: 'E2E: Enrollment - Percentage (repeated)',
        type: 'LINE_LIST',
        headers: [
            'Event org. unit',
            'Enrollment date (e2e)',
            'E2E - Percentage (oldest)',
            'E2E - Percentage (oldest +1)',
            'E2E - Percentage (most recent -1)',
            'E2E - Percentage (most recent)',
        ],
    },
    {
        covers: 'Enrollment line list, repeated events',
        id: 'WrIV7ZoYECj',
        name: 'E2E: Enrollment - Hemoglobin (repeated)',
        type: 'LINE_LIST',
        headers: [
            'Enrollment org. unit',
            'Date of first visit',
            'WHOMCH Hemoglobin value (most recent -2)',
            'WHOMCH Hemoglobin value (most recent -1)',
            'WHOMCH Hemoglobin value (most recent)',
        ],
    },
    {
        covers: 'Tracked entity line list, tracked entity type only',
        id: 'cRuVDbe3Lga',
        name: 'EVER [Line list] [TE] Basic',
        type: 'LINE_LIST',
        headers: ['Registration org. unit', 'Created on', 'Gender'],
    },
    {
        covers: 'Tracked entity line list, tracked entity type only',
        id: 'qTd4CrFQ4hz',
        name: 'EVER Person List',
        type: 'LINE_LIST',
        headers: ['Registration org. unit', 'First name'],
    },
    {
        covers: 'Tracked entity line list, tracked entity type and one program',
        id: 'cHhlOdJqqox',
        name: 'EVER Person List - LL breaking',
        type: 'LINE_LIST',
        headers: [
            'Registration org. unit',
            'First name',
            'Enrollment org. unit',
        ],
    },
    {
        covers: 'Tracked entity line list, tracked entity type and one program',
        id: 'GOIpY8GFUJp',
        name: 'EVER [Line list] [TE] Stage and enrollment dimension',
        type: 'LINE_LIST',
        headers: [
            'Registration org. unit',
            'Enrollment org. unit',
            'Date of enrollment',
            'MCH Apgar Score',
        ],
    },
    {
        covers: 'Tracked entity line list, two programs',
        id: 'IS74uKRvJvl',
        name: 'E2E: Tracked entity line list, two programs',
        type: 'LINE_LIST',
        headers: [
            'Registration org. unit',
            'First name',
            'Last name',
            'E2E TE P1 enrollment date · E2E TE program 1',
            'E2E TE - DE 1 (cross program) · E2E TE P1 stage 1',
            'E2E TE - DE 1 (cross program) · E2E TE P2 stage 1',
            'Created on',
        ],
    },
    {
        covers: 'Event pivot table, event program',
        id: 't6KrUiPqcd0',
        name: 'E2E: Event pivot table, event program',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Male', '0 - 10', '10 - 20'],
        rowHeaders: ['Bo', 'Western Area', 'Total'],
    },
    {
        covers: 'Event pivot table, data element value',
        id: 'n2ZQVP3taPF',
        name: 'E2E: Event pivot table, data element value',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Discharged', 'Died', 'Transferred', 'Absconded'],
        rowHeaders: [],
    },
    {
        covers: 'Event pivot table, categories and category option group sets',
        id: 'EidT2M2SzAo',
        name: 'E2E: Event pivot table, categories',
        type: 'PIVOT_TABLE',
        columnHeaders: ['APHIAplus', 'African Medical and Research Foundation'],
        rowHeaders: ['DOD', 'CDC', 'Positive', 'Negative', 'Mixed'],
    },
    {
        covers: 'Event pivot table, tracker stage with enrollment dimensions',
        id: 'pb8yapu3EVC',
        name: 'EVER [Pivot table] [Event] Basic',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Sierra Leone', 'Active', 'Completed'],
        rowHeaders: [],
    },
    {
        covers: 'Event pivot table, tracker stage with enrollment dimensions',
        id: 'TKrpEtzneOk',
        name: 'EVER [Pivot table] [Event] Stage and enrollment dimensions',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Active', 'Completed'],
        rowHeaders: [],
    },
    {
        covers: 'Event pivot table, tracker stage with attributes and registration org unit',
        id: 'D648CB4jn8G',
        name: 'E2E: Event pivot table, attributes and registration org unit',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Male', 'Female'],
        rowHeaders: ['Bo', 'Western Area'],
    },
    {
        covers: 'Event pivot table, tracker stage, data element value',
        id: 'q4rwy9jfGCK',
        name: 'E2E: Event pivot table, tracker stage, data element value',
        type: 'PIVOT_TABLE',
        columnHeaders: ['NVP only', 'Others'],
        rowHeaders: [],
    },
    {
        covers: 'Enrollment pivot table, several stages with enrollment dimensions',
        id: 'Z2mxfl7gTTA',
        name: 'E2E: Enrollment pivot table, several stages',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Active'],
        rowHeaders: ['Bo', 'NVP only', 'Others'],
    },
    {
        covers: 'Enrollment pivot table, data element value',
        id: 'unFRccFpt4V',
        name: 'E2E: Enrollment pivot table, data element value',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Active'],
        rowHeaders: ['Bo', 'Western Area'],
        /* The backend does not store the value's program stage yet, and an
         * enrollment pivot table can't be requested without it */
        skip: true,
    },
    {
        covers: 'Enrollment pivot table, attribute value',
        id: 'O2sqK93AD4w',
        name: 'E2E: Enrollment pivot table, attribute value',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Male', 'Female'],
        rowHeaders: ['Bo', 'Western Area'],
    },
    {
        covers: 'Legacy line list',
        id: 'PRVegIpABeb',
        name: 'Inpatient: Visit overview this year Bo',
        type: 'LINE_LIST',
        headers: [
            'Report date',
            'Event org. unit',
            'Admission Date',
            'Age in years',
            'Average age of deaths',
            'Average age of female discharges',
            'Average height of boys at 10 years old',
            'Average height of girls at 5 years old',
            'BMI',
            'BMI female',
            'BMI female under 5 y',
            'BMI male',
            'BMI male under 5 y',
            'Diagnosis (ICD-10)',
            'Discharge Date',
            'Gender',
            'Height in cm',
            'Inpatient bed days average',
            'Mode of Discharge',
            'Pregnant',
            'Weight in kg',
        ],
    },
    {
        covers: 'Legacy pivot table, data element value',
        id: 'aDrb9UMVxt0',
        name: 'Inpatient: Average weight by mode of discharge and gender last 4 q',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Sierra Leone', 'Total'],
        rowHeaders: ['Discharged', 'Male', 'Female', 'Died', 'Total'],
    },
]

const createInterpretation = (visualizationId: string, text: string) =>
    cy
        .request({
            method: 'POST',
            url: `${getApiBaseUrl()}/interpretations/eventVisualization/${visualizationId}`,
            headers: { 'Content-Type': 'text/plain' },
            body: text,
        })
        .then(({ headers }) => String(headers.location).split('/').pop())

describe('saved visualizations', () => {
    VISUALIZATIONS.forEach((visualization) => {
        const { covers, id, name, skip } = visualization
        const describeVisualization = skip ? describe.skip : describe

        describeVisualization(`${covers}: ${name}`, () => {
            const interpretationTexts: string[] = []

            /* afterEach, because a retry starts the test again and posts
             * another */
            afterEach(() => {
                interpretationTexts
                    .splice(0)
                    .forEach((text) => deleteInterpretations(id, text))
            })

            it('renders in the app and in an interpretation', () => {
                const interpretationText = testObjectName('interpretation')
                interpretationTexts.push(interpretationText)
                cy.visit(`/#/${id}`)

                expectVisTitleToEqual(name)
                expectVisualizationToRender(visualization)

                createInterpretation(id, interpretationText).then(
                    (interpretationId) =>
                        cy.visit(
                            `/#/${id}?interpretationId=${interpretationId}`
                        )
                )

                cy.getByDataTest('interpretation-modal').contains(
                    interpretationText
                )
                expectVisualizationToRender(visualization, () =>
                    cy.getByDataTest('interpretation-modal')
                )
            })

            it('renders in the dashboard plugin', () => {
                cy.visit('/plugin-host.html')
                cy.getByDataTest('plugin-host-visualization-id-input').type(id)

                expectVisualizationToRender(visualization, pluginBody)
            })
        })
    })
})
