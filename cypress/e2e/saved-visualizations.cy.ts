import { expectVisTitleToEqual } from '../helpers'
import { pluginBody } from '../support/dashboard-plugin'
import { getApiBaseUrl } from '../support/utils'

/* Line lists list every header, in order. Pivot tables list a few column and
 * row headers that don't depend on the data: period headers move with the
 * yearly date shift, and items without data drop out. A wide pivot table only
 * renders the columns in view, so the column headers are the leftmost ones. */
type ExpectedRendering =
    | { type: 'LINE_LIST'; headers: string[] }
    | { type: 'PIVOT_TABLE'; columnHeaders: string[]; rowHeaders: string[] }

type SavedVisualization = ExpectedRendering & {
    /* The row in visualization-matrix.md this visualization covers */
    row: string
    id: string
    name: string
    skip?: boolean
}

const VISUALIZATIONS: SavedVisualization[] = [
    {
        row: 'L1',
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
        row: 'L2',
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
        row: 'L3',
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
        row: 'L4',
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
        row: 'L4',
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
        row: 'L5',
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
        row: 'L6',
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
        row: 'L6',
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
        row: 'L7',
        id: 'cRuVDbe3Lga',
        name: 'EVER [Line list] [TE] Basic',
        type: 'LINE_LIST',
        headers: ['Registration org. unit', 'Created on', 'Gender'],
    },
    {
        row: 'L7',
        id: 'qTd4CrFQ4hz',
        name: 'EVER Person List',
        type: 'LINE_LIST',
        headers: ['Registration org. unit', 'First name'],
    },
    {
        row: 'L8',
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
        row: 'L8',
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
        row: 'L9',
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
        row: 'P1',
        id: 't6KrUiPqcd0',
        name: 'E2E: Event pivot table, event program',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Male', '0 - 10', '10 - 20'],
        rowHeaders: ['Bo', 'Western Area', 'Total'],
    },
    {
        row: 'P2',
        id: 'n2ZQVP3taPF',
        name: 'E2E: Event pivot table, data element value',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Discharged', 'Died', 'Transferred', 'Absconded'],
        rowHeaders: [],
    },
    {
        row: 'P3',
        id: 'EidT2M2SzAo',
        name: 'E2E: Event pivot table, categories',
        type: 'PIVOT_TABLE',
        columnHeaders: ['APHIAplus', 'African Medical and Research Foundation'],
        rowHeaders: ['DOD', 'CDC', 'Positive', 'Negative', 'Mixed'],
    },
    {
        row: 'P4',
        id: 'pb8yapu3EVC',
        name: 'EVER [Pivot table] [Event] Basic',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Sierra Leone', 'Active', 'Completed'],
        rowHeaders: [],
    },
    {
        row: 'P4',
        id: 'TKrpEtzneOk',
        name: 'EVER [Pivot table] [Event] Stage and enrollment dimensions',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Active', 'Completed'],
        rowHeaders: [],
    },
    {
        row: 'P5',
        id: 'D648CB4jn8G',
        name: 'E2E: Event pivot table, attributes and registration org unit',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Male', 'Female'],
        rowHeaders: ['Bo', 'Western Area'],
    },
    {
        row: 'P6',
        id: 'q4rwy9jfGCK',
        name: 'E2E: Event pivot table, tracker stage, data element value',
        type: 'PIVOT_TABLE',
        columnHeaders: ['NVP only', 'Others'],
        rowHeaders: [],
    },
    {
        row: 'P7',
        id: 'Z2mxfl7gTTA',
        name: 'E2E: Enrollment pivot table, several stages',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Active'],
        rowHeaders: ['Bo', 'NVP only', 'Others'],
    },
    {
        row: 'P8',
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
        row: 'P9',
        id: 'O2sqK93AD4w',
        name: 'E2E: Enrollment pivot table, attribute value',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Male', 'Female'],
        rowHeaders: ['Bo', 'Western Area'],
    },
    {
        row: 'Legacy',
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
        row: 'Legacy',
        id: 'aDrb9UMVxt0',
        name: 'Inpatient: Average weight by mode of discharge and gender last 4 q',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Sierra Leone', 'Total'],
        rowHeaders: ['Discharged', 'Male', 'Female', 'Died', 'Total'],
    },
]

const INTERPRETATION_TEXT = 'E2E saved visualization interpretation'

type Container = () => Cypress.Chainable<JQuery<HTMLElement>>

const getHeaderTexts = ($headers: JQuery<HTMLElement>) =>
    [...$headers].map((header) => header.innerText.replace(/\s+/g, ' ').trim())

const expectLineListToRender = (headers: string[], container: Container) => {
    container()
        .find('[data-test="data-table-header"]')
        .should(($headers) => {
            expect(getHeaderTexts($headers)).to.deep.equal(headers)
        })
    container()
        .find('[data-test="table-row"]')
        .should('have.length.greaterThan', 0)
}

const expectPivotTableToRender = (
    columnHeaders: string[],
    rowHeaders: string[],
    container: Container
) => {
    container()
        .find('[data-test="visualization-column-header"]')
        .should(($headers) => {
            expect(getHeaderTexts($headers)).to.include.members(columnHeaders)
        })
    container()
        .find('[data-test="visualization-row-header"]')
        .should(($headers) => {
            expect(getHeaderTexts($headers)).to.include.members(rowHeaders)
        })
    container()
        .find('[data-test="visualization-container"] tbody tr')
        .should('have.length.greaterThan', 0)
}

const expectVisualizationToRender = (
    expected: ExpectedRendering,
    container: Container
) => {
    switch (expected.type) {
        case 'LINE_LIST':
            expectLineListToRender(expected.headers, container)
            break
        case 'PIVOT_TABLE':
            expectPivotTableToRender(
                expected.columnHeaders,
                expected.rowHeaders,
                container
            )
            break
    }
    container().find('[data-test="canvas-error"]').should('not.exist')
}

const createInterpretation = (visualizationId: string) =>
    cy
        .request({
            method: 'POST',
            url: `${getApiBaseUrl()}/interpretations/eventVisualization/${visualizationId}`,
            headers: { 'Content-Type': 'text/plain' },
            body: INTERPRETATION_TEXT,
        })
        .then(({ headers }) => String(headers.location).split('/').pop())

const deleteTestInterpretations = (visualizationId: string) =>
    cy
        .request(
            `${getApiBaseUrl()}/interpretations?fields=id&paging=false&filter=eventVisualization.id:eq:${visualizationId}&filter=text:eq:${INTERPRETATION_TEXT}`
        )
        .then(({ body }) =>
            body.interpretations.forEach(({ id }: { id: string }) =>
                cy.request({
                    method: 'DELETE',
                    url: `${getApiBaseUrl()}/interpretations/${id}`,
                    failOnStatusCode: false,
                })
            )
        )

describe('saved visualizations', () => {
    VISUALIZATIONS.forEach((visualization) => {
        const { row, id, name, skip } = visualization
        const describeVisualization = skip ? describe.skip : describe

        describeVisualization(`${row}: ${name}`, () => {
            it('renders in the app and in an interpretation', () => {
                cy.visit(`/#/${id}`)

                expectVisTitleToEqual(name)
                expectVisualizationToRender(visualization, () =>
                    cy.get<HTMLElement>('body')
                )

                createInterpretation(id).then((interpretationId) =>
                    cy.visit(`/#/${id}?interpretationId=${interpretationId}`)
                )

                cy.getByDataTest('interpretation-modal').contains(
                    INTERPRETATION_TEXT
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

            after(() => deleteTestInterpretations(id))
        })
    })
})
