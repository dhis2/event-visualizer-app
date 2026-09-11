/**
 * Recaptures the line-list fixtures by loading each visualization in the
 * running app against the e2e.im.dhis2.org/analytics-dev instance (the
 * same one CI's e2e suite runs against) and writing the intercepted API
 * responses verbatim into the fixture directories.
 *
 * Excluded from normal e2e runs (it lives outside the e2e specPattern);
 * run it with:
 *
 *   pnpm cy:capture-fixtures
 *
 * Run `pnpm format` afterwards to normalize the written JSON.
 */
const FIXTURES_DIR = 'src/components/line-list/__fixtures__'

/* One entry per fixture directory; see the README there. */
const SCENARIOS = [
    { directory: 'e2e-enrollment', id: 'AFjkDs7acBh' },
    { directory: 'inpatient-visit-overview-bombali', id: 'kb9Uml5FEEz' },
    { directory: 'inpatient-extra-columns-and-legends', id: 'Rq4ppYwc4r8' },
    { directory: 'no-time-dimension', id: 'ETJXkMmCGsK' },
]

describe('recapture line-list fixtures', () => {
    SCENARIOS.forEach(({ directory, id }) => {
        it(`recaptures ${directory}`, () => {
            const captured: Record<string, unknown> = {}

            cy.intercept('GET', `**/eventVisualizations/${id}?*`, (req) => {
                req.continue((res) => {
                    captured['event-visualization'] = res.body
                })
            })
            cy.intercept('GET', '**/analytics/*/query/**', (req) => {
                req.continue((res) => {
                    captured['analytics'] = res.body
                })
            })
            cy.intercept('GET', '**/legendSets?*', (req) => {
                req.continue((res) => {
                    captured['legend-sets'] = (
                        res.body as { legendSets: unknown }
                    ).legendSets
                })
            })

            cy.visit(`/#/${id}`)
            // The table appearing means every captured request has settled
            cy.getByDataTest('line-list-data-table').then(() => {
                expect(
                    captured['event-visualization'],
                    'event-visualization'
                ).to.not.equal(undefined)
                expect(captured['analytics'], 'analytics').to.not.equal(
                    undefined
                )
                for (const [fileName, body] of Object.entries(captured)) {
                    cy.writeFile(
                        `${FIXTURES_DIR}/${directory}/${fileName}.json`,
                        JSON.stringify(body, null, 4) + '\n'
                    )
                }
            })
        })
    })
})
