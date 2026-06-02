import fs from 'node:fs'
import { defineConfig } from 'cypress'
import { excludeByVersionTags } from './cypress/plugins/exclude-by-version-tags'
import viteConfig from './vite-cypress.config'

const setupNodeEvents = async (
    on: Cypress.PluginEvents,
    config: Cypress.PluginConfigOptions
) => {
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
            if (
                typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                error.code === 'ENOENT'
            ) {
                // eslint-disable-next-line no-console
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

    // Bridge non-sensitive env vars to expose so browser code can use
    // Cypress.expose() instead of the deprecated Cypress.env()
    config.expose = {
        ...config.expose,
        dhis2BaseUrl: config.env.dhis2BaseUrl,
        dhis2InstanceVersion: config.env.dhis2InstanceVersion,
        dhis2DatatestPrefix: config.env.dhis2DatatestPrefix,
        hideRequestsFromLog: config.env.hideRequestsFromLog,
    }

    return config
}

module.exports = defineConfig({
    projectId: 'prcq4z',
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
        defaultCommandTimeout: 30000,
    },
    allowCypressEnv: false,
    expose: {
        dhis2DatatestPrefix: 'dhis2-eventvisualizer',
    },
    component: {
        devServer: {
            framework: 'react',
            bundler: 'vite',
            viteConfig,
        },
    },
})
