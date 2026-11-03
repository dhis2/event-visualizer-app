import { expectVisTitleToEqual } from '../helpers'
import { deleteInterpretations } from './api'
import { pluginBody } from './dashboard-plugin'
import { testObjectName } from './names'
import type { ExpectedRendering } from './rendering'
import { expectVisualizationToRender } from './rendering'
import { getApiBaseUrl } from './utils'

type SavedVisualization = ExpectedRendering & {
    covers: string
    id: string
    name: string
    skip?: boolean
}

const createInterpretation = (visualizationId: string, text: string) =>
    cy
        .request({
            method: 'POST',
            url: `${getApiBaseUrl()}/interpretations/eventVisualization/${visualizationId}`,
            headers: { 'Content-Type': 'text/plain' },
            body: text,
        })
        .then(({ headers }) => String(headers.location).split('/').pop())

/* Every saved visualization goes through the same steps. The visualizations
 * are split over several spec files so CI can spread them over its runners. */
export const describeSavedVisualizations = (
    title: string,
    visualizations: SavedVisualization[]
) =>
    describe(`saved visualizations: ${title}`, () => {
        visualizations.forEach((visualization) => {
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
                    cy.getByDataTest('plugin-host-visualization-id-input').type(
                        id
                    )

                    expectVisualizationToRender(visualization, pluginBody)
                })
            })
        })
    })
