/**
 * Recaptures the line-list fixtures by loading each visualization in the
 * running app against the ever-playground instance and writing the
 * intercepted API responses verbatim into the fixture directories.
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
const VISUALIZATION_IDS = [
    'AFjkDs7acBh',
    'kb9Uml5FEEz',
    'A8CgvIY3VEy',
    'ylhECvoYdzK',
]

describe('recapture line-list fixtures', () => {
    VISUALIZATION_IDS.forEach((id) => {
        it(`recaptures ${id}`, () => {
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
                        `${FIXTURES_DIR}/${id}/${fileName}.json`,
                        JSON.stringify(body, null, 4) + '\n'
                    )
                }
            })
        })
    })
})
