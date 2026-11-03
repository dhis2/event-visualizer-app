import { getApiBaseUrl } from './utils'

const getNewUid = () =>
    cy
        .request(`${getApiBaseUrl()}/system/id`)
        .then(({ body }) => body.codes[0] as string)

/* Goes through the metadata export and import, like
 * visualization-metadata-import/, so the copy holds exactly what was saved. */
export const copyVisualization = (id: string, name: string) =>
    cy
        .request(
            `${getApiBaseUrl()}/metadata?eventVisualizations=true&skipSharing=true&skipCreatedAndLastUpdated=true&filter=id:eq:${id}`
        )
        .then(({ body }) =>
            getNewUid().then((newId) =>
                cy
                    .request({
                        method: 'POST',
                        url: `${getApiBaseUrl()}/metadata?atomicMode=ALL&importReportMode=ERRORS`,
                        body: {
                            eventVisualizations: [
                                {
                                    ...body.eventVisualizations[0],
                                    id: newId,
                                    name,
                                },
                            ],
                        },
                    })
                    .then(() => newId)
            )
        )

export const deleteVisualizationViaApi = (id: string) =>
    cy.request({
        method: 'DELETE',
        url: `${getApiBaseUrl()}/eventVisualizations/${id}`,
        failOnStatusCode: false,
    })

export const getVisualization = (id: string, fields: string) =>
    cy
        .request(
            `${getApiBaseUrl()}/eventVisualizations/${id}?fields=${fields}`
        )
        .then(({ body }) => body as Record<string, unknown>)

export const deleteInterpretations = (visualizationId: string, text: string) =>
    cy
        .request(
            `${getApiBaseUrl()}/interpretations?fields=id&paging=false&filter=eventVisualization.id:eq:${visualizationId}&filter=text:eq:${encodeURIComponent(text)}`
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

export const getCurrentUserId = () =>
    cy
        .request(`${getApiBaseUrl()}/me?fields=id`)
        .then(({ body }) => body.id as string)
