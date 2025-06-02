import fs from 'node:fs'
import { defineConfig } from 'cypress'
import { excludeByVersionTags } from './cypress/plugins/exclude-by-version-tags.ts'

async function setupNodeEvents(
    on: Cypress.PluginEvents,
    config: Cypress.PluginConfigOptions
) {
    excludeByVersionTags(on, config)

    // Delete videos for passing tests
    on('after:spec', (_, results) => {
        try {
            if (results && results.video) {
                // Do we have failures for any retry attempts?
                const failures = results.tests.some((test) =>
                    test.attempts.some((attempt) => attempt.state === 'failed')
                )
                if (!failures) {
                    // delete the video if the spec passed and no tests retried
                    fs.unlinkSync(results.video)
                }
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('Video already deleted')
            } else {
                throw error
            }
        }
    })

    if (!config.env.dhis2InstanceVersion) {
        throw new Error(
            'dhis2InstanceVersion is missing. Check the README for more information.'
        )
    }

    return config
}

module.exports = defineConfig({
    projectId: 'NEEDED',
    e2e: {
        setupNodeEvents,
        baseUrl: 'http://localhost:3000',
        specPattern: 'cypress/e2e/**/*.cy.ts',
        viewportWidth: 1280,
        viewportHeight: 800,
        // Record video
        video: true,
        // Enabled to reduce the risk of out-of-memory issues
        experimentalMemoryManagement: true,
        // Set to a low number to reduce the risk of out-of-memory issues
        numTestsKeptInMemory: 5,
        /* When allowing 1 retry on CI, the test suite will pass if
         * it's flaky. And/but we also get to identify flaky tests on the
         * Cypress Dashboard. */
        retries: {
            runMode: 1,
            openMode: 0,
        },
    },
    env: {
        dhis2DatatestPrefix: 'dhis2-eventvisualizer',
    },
})
