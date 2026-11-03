import fs from 'node:fs'
import path from 'node:path'
// eslint-disable-next-line no-restricted-imports
import dump from '../../visualization-metadata-import/db-dump-visualizations.json'

type VisualizationNames = Record<string, string>

const readImportedVisualizations = (directory: string): VisualizationNames =>
    Object.fromEntries(
        fs
            .readdirSync(directory)
            .filter((file) => file.endsWith('.json'))
            .flatMap(
                (file) =>
                    JSON.parse(
                        fs.readFileSync(path.join(directory, file), 'utf8')
                    ).eventVisualizations as Array<{ id: string; name: string }>
            )
            .map(({ id, name }) => [id, name])
    )

const listMissing = (expected: VisualizationNames, onInstance: Set<string>) =>
    Object.entries(expected)
        .filter(([id]) => !onInstance.has(id))
        .map(([id, name]) => `  ${id} ${name}`)

/* The suite assumes the instance holds the DB dump plus
 * visualization-metadata-import/. Checking that once per run gives a clear
 * message instead of render failures deep inside the specs. */
export const checkInstanceVisualizations = async (
    config: Cypress.PluginConfigOptions
) => {
    const imported = readImportedVisualizations(
        path.join(
            config.projectRoot,
            'visualization-metadata-import',
            'visualizations'
        )
    )

    const { dhis2BaseUrl, dhis2Username, dhis2Password } = config.env
    const response = await fetch(
        `${dhis2BaseUrl}/api/eventVisualizations?fields=id&paging=false`,
        {
            headers: {
                Authorization: `Basic ${Buffer.from(`${dhis2Username}:${dhis2Password}`).toString('base64')}`,
            },
        }
    )
    if (!response.ok) {
        throw new Error(
            `Could not list the visualizations on ${dhis2BaseUrl}: ${response.status} ${response.statusText}`
        )
    }
    const { eventVisualizations } = (await response.json()) as {
        eventVisualizations: Array<{ id: string }>
    }
    const onInstance = new Set(eventVisualizations.map(({ id }) => id))

    const missingFromDump = listMissing(dump, onInstance)
    const notImported = listMissing(imported, onInstance)

    if (missingFromDump.length || notImported.length) {
        throw new Error(
            [
                `${dhis2BaseUrl} doesn't have every visualization the E2E suite needs.`,
                ...(missingFromDump.length
                    ? [
                          'From the DB dump, but deleted from the instance:',
                          ...missingFromDump,
                      ]
                    : []),
                ...(notImported.length
                    ? [
                          'From visualization-metadata-import/, but not imported (run import.sh):',
                          ...notImported,
                      ]
                    : []),
            ].join('\n')
        )
    }
}
