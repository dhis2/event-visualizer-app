import { plugin as cypressGrepPlugin } from '@cypress/grep/plugin'
// eslint-disable-next-line no-restricted-imports
import d2config from '../../d2.config.js'

/* Version tagging is exclusion-based: a test tagged '@skip-44' does not run
 * against a 2.44 backend, and an untagged test runs against every version.
 * Since each test run targets a single backend, the filter is a single
 * negation: '-@skip-<version of the instance under test>'.
 *
 * Note that a positive tag filter would skip all untagged tests, and that
 * multiple negations must be AND-joined ('-@skip-43+-@skip-45'): a
 * space-separated list is an OR, which only excludes tests carrying every one
 * of those tags. */

const extractMinorVersion = (version: string): number =>
    version.startsWith('2.')
        ? parseInt(version.slice(2, 4))
        : parseInt(version.slice(0, 2))

const MIN_DHIS2_VERSION = extractMinorVersion(
    String(d2config.minDHIS2Version ?? '')
)

/* DHIS2 supports the three most recent releases, so the development branch is
 * always one version ahead of those: minimum supported + 3. */
const DEV_VERSION = MIN_DHIS2_VERSION + 3

const getInstanceMinorVersion = (instanceVersion: string | number): number =>
    String(instanceVersion).toLowerCase() === 'dev'
        ? DEV_VERSION
        : extractMinorVersion(String(instanceVersion))

export const selectByVersionTags = (config: Cypress.PluginConfigOptions) => {
    const instanceVersion = getInstanceMinorVersion(
        config.env.dhis2InstanceVersion
    )

    if (Number.isNaN(instanceVersion)) {
        throw new Error(
            `Could not read a DHIS2 minor version from dhis2InstanceVersion "${config.env.dhis2InstanceVersion}"`
        )
    }

    if (instanceVersion < MIN_DHIS2_VERSION) {
        throw new Error(
            `Instance version ${instanceVersion} is lower than the minimum supported version ${MIN_DHIS2_VERSION}`
        )
    }

    config.expose = {
        ...config.expose,
        grepTags: `-@skip-${instanceVersion}`,
        // Excluded tests are left out of the results instead of reported as pending
        grepOmitFiltered: true,
        grepFilterSpecs: true,
    }

    cypressGrepPlugin(config)

    return config
}
